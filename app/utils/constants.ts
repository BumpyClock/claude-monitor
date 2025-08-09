export const EVENT_TYPE_ICONS: Record<string, string> = {
  'pre_tool_use': '🔧',
  'post_tool_use': '✅',
  'user_prompt_submit': '💬',
  'stop': '🛑',
  'notification': '🔔',
  'subagent_stop': '👥',
  'pre_compact': '📦',
  'default': '📌'
};

export const DEFAULT_MAX_EVENTS = 200;
export const WEBSOCKET_RECONNECT_DELAY = 3000;
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500
} as const;