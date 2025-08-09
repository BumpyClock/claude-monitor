// Event type labels without emojis
const eventTypeToLabel: Record<string, string> = {
  'PreToolUse': 'Tool',
  'PostToolUse': 'Done',
  'Notification': 'Alert',
  'Stop': 'Stop',
  'SubagentStop': 'Agent',
  'PreCompact': 'Compact',
  'UserPromptSubmit': 'Prompt',
  // Default
  'default': 'Event'
};

export function useEventEmojis() {
  const getEmojiForEventType = (eventType: string): string => {
    // Return empty string instead of emoji for chart usage
    return '';
  };
  
  const formatEventTypeLabel = (eventTypes: Record<string, number>): string => {
    // For charts, we don't need visual indicators anymore
    // The chart will use colors to differentiate
    return '';
  };
  
  const getLabelForEventType = (eventType: string): string => {
    return eventTypeToLabel[eventType] || eventTypeToLabel.default;
  };
  
  return {
    getEmojiForEventType,
    formatEventTypeLabel,
    getLabelForEventType
  };
}