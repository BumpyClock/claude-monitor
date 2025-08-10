import { promises as fs } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { spawn, execFile as _execFile } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { CONSTANTS_PY_CONTENT } from './hook-templates/python-constants';

const execFile = promisify(_execFile);

export interface HookInstallOptions {
  targetPath: string;
  displayName: string;
  serverUrl: string;
}

export interface InstallValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

interface FileIntegrityInfo {
  path: string;
  size: number;
  hash: string;
}

export function generateSourceAppSlug(displayName: string): string {
  return `project-${displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

export function generateClaudeMonitorHooks(sourceApp: string) {
  return {
    PreToolUse: [{
      matcher: "",
      hooks: [
        { type: "command", command: "uv run .claude/hooks/pre_tool_use.py" },
        { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type PreToolUse --summarize` }
      ]
    }],
    PostToolUse: [{
      matcher: "",
      hooks: [
        { type: "command", command: "uv run .claude/hooks/post_tool_use.py" },
        { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type PostToolUse --summarize` }
      ]
    }],
    Stop: [{
      matcher: "",
      hooks: [
        { type: "command", command: "uv run .claude/hooks/stop.py --chat" },
        { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type Stop --add-chat` }
      ]
    }],
    UserPromptSubmit: [{
      hooks: [
        { type: "command", command: "uv run .claude/hooks/user_prompt_submit.py --log-only" },
        { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type UserPromptSubmit --summarize` }
      ]
    }],
    SubagentStop: [{
      matcher: "",
      hooks: [
        { type: "command", command: "uv run .claude/hooks/subagent_stop.py" },
        { type: "command", command: `uv run .claude/hooks/send_event.py --source-app ${sourceApp} --event-type SubagentStop` }
      ]
    }]
  };
}

async function calculateFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

async function verifyFileIntegrity(sourcePath: string, targetPath: string): Promise<boolean> {
  try {
    const [sourceStats, targetStats] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(targetPath)
    ]);
    
    // Check file sizes match
    if (sourceStats.size !== targetStats.size) {
      return false;
    }
    
    // For small files, verify content hash
    if (sourceStats.size < 1024 * 1024) { // 1MB threshold
      const [sourceHash, targetHash] = await Promise.all([
        calculateFileHash(sourcePath),
        calculateFileHash(targetPath)
      ]);
      return sourceHash === targetHash;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function copyDirectoryWithIntegrity(source: string, target: string): Promise<FileIntegrityInfo[]> {
  const copiedFiles: FileIntegrityInfo[] = [];
  
  // Ensure target directory exists with atomic operation
  await fs.mkdir(target, { recursive: true });
  
  // Read source directory
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directories
      const subFiles = await copyDirectoryWithIntegrity(sourcePath, targetPath);
      copiedFiles.push(...subFiles);
    } else if (entry.isFile()) {
      // Special handling for constants.py - generate from template instead of copying
      if (entry.name === 'constants.py' && sourcePath.includes('/utils/')) {
        // Generate from template to maintain single source of truth
        await fs.writeFile(targetPath, CONSTANTS_PY_CONTENT, 'utf-8');
        
        const stats = await fs.stat(targetPath);
        const hash = await calculateFileHash(targetPath);
        
        copiedFiles.push({
          path: entry.name,
          size: stats.size,
          hash
        });
        continue; // Skip normal copy process
      }
      
      // Copy file with verification
      await fs.copyFile(sourcePath, targetPath);
      
      // Verify integrity
      const isValid = await verifyFileIntegrity(sourcePath, targetPath);
      if (!isValid) {
        // Cleanup failed copy
        await fs.unlink(targetPath).catch(() => {});
        throw new Error(`File integrity check failed for: ${entry.name}`);
      }
      
      const stats = await fs.stat(targetPath);
      const hash = await calculateFileHash(targetPath);
      
      copiedFiles.push({
        path: entry.name,
        size: stats.size,
        hash
      });
    }
  }
  
  return copiedFiles;
}

async function validateTargetPath(targetPath: string): Promise<InstallValidationResult> {
  try {
    // Resolve to absolute path and check for directory traversal
    const absolutePath = resolve(targetPath);
    const relativePath = relative(process.cwd(), absolutePath);
    
    // Prevent traversal outside reasonable bounds (basic protection)
    if (relativePath.startsWith('../..')) {
      return {
        isValid: false,
        error: 'Target path cannot traverse outside parent directories for security reasons'
      };
    }
    
    // Check if path exists and is directory
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return {
        isValid: false,
        error: 'Target path is not a directory'
      };
    }
    
    // Check write permissions by trying to create a test file
    const testFile = join(absolutePath, '.claude-install-test');
    try {
      await fs.writeFile(testFile, 'test', { flag: 'wx' }); // wx = fail if exists
      await fs.unlink(testFile);
    } catch (error: any) {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        return {
          isValid: false,
          error: `No write permissions for target directory: ${absolutePath}`
        };
      }
    }
    
    return { isValid: true };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.code === 'ENOENT' 
        ? `Target path does not exist: ${targetPath}`
        : `Target path is not accessible: ${targetPath}`
    };
  }
}

async function validateServerConnectivity(serverUrl: string): Promise<InstallValidationResult> {
  try {
    const url = new URL(serverUrl);
    
    // Basic protocol validation
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'Server URL must use HTTP or HTTPS protocol'
      };
    }
    
    // Test connectivity with a simple fetch (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    try {
      const response = await fetch(url.origin, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // We don't care about the specific response, just that it's reachable
      return { 
        isValid: true, 
        warnings: response.ok ? [] : [`Server returned ${response.status}, but is reachable`]
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          isValid: true, // Don't fail on timeout, just warn
          warnings: ['Server connection timeout - hooks may not work until server is running']
        };
      }
      
      return {
        isValid: true, // Don't fail on network errors, just warn
        warnings: [`Cannot reach server at ${serverUrl} - hooks may not work until server is running`]
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid server URL format'
    };
  }
}

async function checkUvInstallation(): Promise<InstallValidationResult> {
  try {
    await execFile('uv', ['--version'], { timeout: 5000 });
    return { isValid: true };
  } catch (error: any) {
    return {
      isValid: true, // Don't fail installation, just warn
      warnings: [
        'uv is not installed or not in PATH. Hooks will not work until you install uv.',
        'Install with: curl -LsSf https://astral.sh/uv/install.sh | sh (macOS/Linux) or visit https://docs.astral.sh/uv/getting-started/installation/'
      ]
    };
  }
}

async function mergeClaudeSettings(settingsPath: string, sourceApp: string, serverUrl: string): Promise<void> {
  const url = new URL(serverUrl);
  const host = url.hostname;
  const port = url.port || '3000';
  
  const newEnv = {
    CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR: "true",
    CLAUDE_MONITOR_HOST: host,
    CLAUDE_MONITOR_PORT: port
  };
  
  const newHooks = generateClaudeMonitorHooks(sourceApp);
  
  let existingSettings: any = {};
  
  // Read existing settings if they exist
  try {
    const existingContent = await fs.readFile(settingsPath, 'utf-8');
    existingSettings = JSON.parse(existingContent);
  } catch {
    // File doesn't exist or is invalid JSON, start fresh
  }
  
  // Merge environment variables (update ours, keep others)
  const mergedEnv = {
    ...existingSettings.env,
    ...newEnv
  };
  
  // Smart merge of hooks - preserve existing non-monitor hooks
  const existingHooks = existingSettings.hooks || {};
  const mergedHooks: any = {};
  
  // First, copy all existing hooks that aren't ours
  for (const [hookType, hookConfigs] of Object.entries(existingHooks)) {
    if (Array.isArray(hookConfigs)) {
      // Filter out any existing Claude Monitor hooks (identified by our commands)
      const nonMonitorHooks = (hookConfigs as any[]).filter(config => {
        if (!Array.isArray(config.hooks)) return true;
        
        return !config.hooks.some((hook: any) => 
          hook.command && (
            hook.command.includes('.claude/hooks/pre_tool_use.py') ||
            hook.command.includes('.claude/hooks/post_tool_use.py') ||
            hook.command.includes('.claude/hooks/send_event.py') ||
            hook.command.includes('.claude/hooks/stop.py') ||
            hook.command.includes('.claude/hooks/user_prompt_submit.py') ||
            hook.command.includes('.claude/hooks/subagent_stop.py')
          )
        );
      });
      
      if (nonMonitorHooks.length > 0) {
        mergedHooks[hookType] = nonMonitorHooks;
      }
    }
  }
  
  // Now add our hooks
  for (const [hookType, hookConfigs] of Object.entries(newHooks)) {
    if (mergedHooks[hookType]) {
      // Append to existing hooks
      mergedHooks[hookType].push(...(hookConfigs as any[]));
    } else {
      // Add new hook type
      mergedHooks[hookType] = hookConfigs;
    }
  }
  
  const finalSettings = {
    ...existingSettings,
    env: mergedEnv,
    hooks: mergedHooks
  };
  
  await fs.writeFile(settingsPath, JSON.stringify(finalSettings, null, 2));
}

export async function installHooks(options: HookInstallOptions) {
  const { targetPath, displayName, serverUrl } = options;
  const warnings: string[] = [];
  
  // Validate target path with security checks
  const pathValidation = await validateTargetPath(targetPath);
  if (!pathValidation.isValid) {
    throw new Error(pathValidation.error!);
  }
  if (pathValidation.warnings) {
    warnings.push(...pathValidation.warnings);
  }
  
  // Validate server connectivity (non-blocking)
  const serverValidation = await validateServerConnectivity(serverUrl);
  if (!serverValidation.isValid) {
    throw new Error(serverValidation.error!);
  }
  if (serverValidation.warnings) {
    warnings.push(...serverValidation.warnings);
  }
  
  // Check uv installation (non-blocking)
  const uvValidation = await checkUvInstallation();
  if (uvValidation.warnings) {
    warnings.push(...uvValidation.warnings);
  }
  
  // Generate source app slug
  const sourceApp = generateSourceAppSlug(displayName);
  
  // Create .claude directory if it doesn't exist
  const targetClaudeDir = join(resolve(targetPath), '.claude');
  await fs.mkdir(targetClaudeDir, { recursive: true });
  
  // Copy hooks from public/claude-resources/hooks with integrity checking
  const sourceHooksDir = join(process.cwd(), 'public', 'claude-resources', 'hooks');
  const targetHooksDir = join(targetClaudeDir, 'hooks');
  
  let copiedFiles: FileIntegrityInfo[] = [];
  try {
    copiedFiles = await copyDirectoryWithIntegrity(sourceHooksDir, targetHooksDir);
  } catch (error) {
    console.error('Error copying hooks:', error);
    throw new Error(`Failed to copy hook files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Smart merge settings.json (preserve existing hooks)
  const settingsPath = join(targetClaudeDir, 'settings.json');
  try {
    await mergeClaudeSettings(settingsPath, sourceApp, serverUrl);
  } catch (error) {
    console.error('Error updating settings.json:', error);
    throw new Error('Failed to update settings.json');
  }
  
  return {
    success: true,
    message: warnings.length > 0 
      ? `Hooks installed with warnings: ${warnings.join('; ')}`
      : 'Hooks installed successfully',
    installedFiles: [...copiedFiles.map(f => f.path), 'settings.json'],
    copiedFiles,
    sourceApp,
    warnings,
    syncMethod: 'copied'
  };
}