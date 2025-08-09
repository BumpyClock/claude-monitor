import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { spawn, execFile as _execFile } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(_execFile);

export interface HookInstallOptions {
  targetPath: string;
  displayName: string;
  serverUrl: string;
}

export function generateSourceAppSlug(displayName: string): string {
  return `project-${displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

export function generateSettingsJson(sourceApp: string, serverUrl: string) {
  // Extract host and port from serverUrl
  const url = new URL(serverUrl);
  const host = url.hostname;
  const port = url.port || '3000';
  
  return {
    env: {
      CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR: "true",
      CLAUDE_MONITOR_HOST: host,
      CLAUDE_MONITOR_PORT: port
    },
    hooks: {
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
    }
  };
}

export async function copyDirectory(source: string, target: string): Promise<string[]> {
  const installedFiles: string[] = [];
  
  // Ensure target directory exists
  await fs.mkdir(target, { recursive: true });
  
  // Read source directory
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directories
      const subFiles = await copyDirectory(sourcePath, targetPath);
      installedFiles.push(...subFiles);
    } else if (entry.isFile()) {
      // Copy file
      await fs.copyFile(sourcePath, targetPath);
      installedFiles.push(entry.name);
    }
  }
  
  return installedFiles;
}

export async function installHooks(options: HookInstallOptions) {
  const { targetPath, displayName, serverUrl } = options;
  
  // Validate target path exists
  try {
    const stats = await fs.stat(targetPath);
    if (!stats.isDirectory()) {
      throw new Error('Target path is not a directory');
    }
  } catch (error) {
    throw new Error(`Target path does not exist or is not accessible: ${targetPath}`);
  }
  
  // Generate source app slug
  const sourceApp = generateSourceAppSlug(displayName);
  
  // Create .claude directory if it doesn't exist
  const targetClaudeDir = join(targetPath, '.claude');
  await fs.mkdir(targetClaudeDir, { recursive: true });
  
  // Copy hooks from public/claude-resources/hooks
  const sourceHooksDir = join(process.cwd(), 'public', 'claude-resources', 'hooks');
  const targetHooksDir = join(targetClaudeDir, 'hooks');
  
  let installedFiles: string[] = [];
  try {
    installedFiles = await copyDirectory(sourceHooksDir, targetHooksDir);
  } catch (error) {
    console.error('Error copying hooks:', error);
    throw new Error('Failed to copy hook files');
  }
  
  // Generate and write settings.json
  const settings = generateSettingsJson(sourceApp, serverUrl);
  const settingsPath = join(targetClaudeDir, 'settings.json');
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  installedFiles.push('settings.json');
  
  return {
    success: true,
    message: 'Hooks installed successfully',
    installedFiles,
    sourceApp,
    syncMethod: 'copied'
  };
}