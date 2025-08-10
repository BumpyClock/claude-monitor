# Configuration

## 🔧 Environment Variables

Claude Monitor uses environment variables for flexible configuration across different deployment environments.

### Server Configuration

```bash
# Server Host and Port
NUXT_PUBLIC_SERVER_PORT=3000
NUXT_PUBLIC_SERVER_HOST=localhost

# Alternative format for different environments
# NUXT_PUBLIC_SERVER_HOST=0.0.0.0  # For Docker containers
# NUXT_PUBLIC_SERVER_HOST=your-domain.com  # For production
```

### Database Configuration

```bash
# SQLite Database Path (relative to project root)
NUXT_DATABASE_PATH=.data/events.db

# Alternative paths:
# NUXT_DATABASE_PATH=/var/lib/claude-monitor/events.db  # System-wide
# NUXT_DATABASE_PATH=./database/events.db               # Custom folder
```

### Performance Tuning

```bash
# Token usage update interval in milliseconds (default: 30 seconds)
NUXT_TOKEN_UPDATE_INTERVAL=30000

# Increase for less frequent updates (better performance):
# NUXT_TOKEN_UPDATE_INTERVAL=60000  # 1 minute

# Decrease for more frequent updates (real-time feel):
# NUXT_TOKEN_UPDATE_INTERVAL=10000  # 10 seconds
```

## 🪝 Claude Code Hook Configuration

The monitor automatically installs comprehensive hooks in your Claude Code projects to capture all relevant events.

### Generated Settings Structure

When you add a project via the "Add Project" button, the system generates a `.claude/settings.json` file with the following structure:

```json
{
  "env": {
    "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "true",
    "CLAUDE_MONITOR_HOST": "localhost",
    "CLAUDE_MONITOR_PORT": "3000"
  },
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "uv run .claude/hooks/pre_tool_use.py" },
        { "type": "command", "command": "uv run .claude/hooks/send_event.py --source-app project-name --event-type PreToolUse --summarize" }
      ]
    }],
    "PostToolUse": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "uv run .claude/hooks/post_tool_use.py" },
        { "type": "command", "command": "uv run .claude/hooks/send_event.py --source-app project-name --event-type PostToolUse --summarize" }
      ]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "uv run .claude/hooks/stop.py --chat" },
        { "type": "command", "command": "uv run .claude/hooks/send_event.py --source-app project-name --event-type Stop --add-chat" }
      ]
    }],
    "UserPromptSubmit": [{
      "hooks": [
        { "type": "command", "command": "uv run .claude/hooks/user_prompt_submit.py --log-only" },
        { "type": "command", "command": "uv run .claude/hooks/send_event.py --source-app project-name --event-type UserPromptSubmit --summarize" }
      ]
    }],
    "SubagentStop": [{
      "matcher": "",
      "hooks": [
        { "type": "command", "command": "uv run .claude/hooks/subagent_stop.py" },
        { "type": "command", "command": "uv run .claude/hooks/send_event.py --source-app project-name --event-type SubagentStop" }
      ]
    }]
  }
}
```

### Hook Event Types

#### PreToolUse
- **Trigger**: Before any Claude Code tool is executed
- **Purpose**: Capture tool preparation and context
- **Data**: Tool name, parameters, session context
- **Summary**: Enabled (reduces payload size)

#### PostToolUse  
- **Trigger**: After tool execution completes
- **Purpose**: Capture tool results and performance
- **Data**: Tool output, execution time, success status
- **Summary**: Enabled (reduces payload size)

#### Stop
- **Trigger**: When Claude completes a task or stops
- **Purpose**: Session completion tracking
- **Data**: Final state, conversation context
- **Chat**: Full conversation history included

#### UserPromptSubmit
- **Trigger**: When user submits a new prompt
- **Purpose**: Track user interactions and requests
- **Data**: Prompt content (anonymized), session state
- **Summary**: Enabled (privacy-focused)

#### SubagentStop
- **Trigger**: When a Claude subagent completes
- **Purpose**: Track complex multi-agent workflows
- **Data**: Subagent results, parent session context
- **Summary**: Disabled (full context needed)

## 🎯 Project-Specific Settings

### Display Names
Projects are automatically assigned display names based on the directory name, but you can customize these:

```json
{
  "appNameMappings": {
    "project-my-app": "My Application",
    "project-website": "Company Website", 
    "project-api": "REST API Service"
  }
}
```

### Hook Environment Variables

Each project gets environment variables for consistent operation:

```bash
# Maintains working directory across hook executions
CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=true

# Monitor server connection details  
CLAUDE_MONITOR_HOST=localhost
CLAUDE_MONITOR_PORT=3000
```

## 🔒 Security Configuration

### Request Validation Limits

```typescript
export const REQUEST_LIMITS = {
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024,    // 10MB max request size
  MAX_CHAT_ITEMS: 1000,                   // Max chat history items  
  MAX_SUMMARY_LENGTH: 10000,              // Max summary length
};
```

### Payload Sanitization

The system automatically sanitizes incoming data to prevent security issues:

- **Dangerous Keys**: Removes `__proto__`, `constructor`, `prototype`
- **Script Tags**: Strips `<script>` elements from string values
- **JavaScript Protocols**: Removes `javascript:` URLs
- **Recursive Sanitization**: Deep cleaning of nested objects

## 🎨 Theme Configuration

### Auto Theme Detection
```json
{
  "autoThemeEnabled": true,
  "themes": {
    "light": { /* light theme variables */ },
    "dark": { /* dark theme variables */ }
  }
}
```

### Custom Theme Variables
```css
:root {
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f8fafc;
  --theme-bg-tertiary: #f1f5f9;
  --theme-text-primary: #1e293b;
  --theme-text-secondary: #64748b;
  --theme-border-primary: #e2e8f0;
}
```

## 📊 Monitoring Configuration

### Event Grouping Settings
```json
{
  "groupingPreferences": {
    "enabled": true,
    "timeWindow": 30000,      // 30 seconds
    "maxGroupSize": 10,       // Max events per group
    "similarityThreshold": 0.8 // Grouping sensitivity
  }
}
```

### Swimlane Preferences  
```json
{
  "swimlanePreferences": {
    "enabled": false,         // Default to timeline view
    "autoCreateLanes": true,  // Auto-create project lanes
    "maxLanes": 5            // Limit visible swimlanes
  }
}
```

## 🔄 Advanced Configuration

### Custom Hook Scripts

You can modify the installed hook scripts in `.claude/hooks/` for custom behavior:

- `pre_tool_use.py`: Pre-execution logic
- `post_tool_use.py`: Post-execution processing  
- `send_event.py`: Event transmission to monitor
- `stop.py`: Session completion handling
- `user_prompt_submit.py`: Prompt processing

### Database Customization

For advanced users, you can modify the SQLite database schema by editing:
- `server/utils/db/init.ts`: Database initialization
- `server/utils/db/events.ts`: Event storage logic

### WebSocket Configuration

Modify WebSocket behavior in:
- `server/routes/stream.ts`: WebSocket route handling
- `server/utils/ws-clients.ts`: Client connection management

## 🚨 Troubleshooting Configuration

### Common Issues

#### Hooks Not Triggering
1. Check Python/UV installation in project
2. Verify `.claude/settings.json` exists
3. Check monitor server is running
4. Verify network connectivity to monitor

#### Database Connection Errors
1. Check write permissions for `.data` directory  
2. Verify `NUXT_DATABASE_PATH` is correct
3. Ensure SQLite is properly installed

#### WebSocket Connection Failed
1. Check firewall settings for port 3000
2. Verify `NUXT_PUBLIC_SERVER_HOST` setting
3. Check browser developer console for errors

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=claude-monitor:*
```