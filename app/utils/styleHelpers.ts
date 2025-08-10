export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getEventTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'pre_tool_use': 'blue',
    'post_tool_use': 'green',
    'user_prompt_submit': 'purple',
    'stop': 'red',
    'notification': 'yellow',
    'subagent_stop': 'indigo',
    'pre_compact': 'orange'
  };
  
  return colorMap[type] || 'gray';
}

export function getEventTypeGradient(type: string): string {
  const color = getEventTypeColor(type);
  return `from-${color}-500 to-${color}-600`;
}

export function getSessionColorClass(sessionId: string, colors: string[]): string {
  if (colors.length === 0) {
    return 'gray-500'; // Fallback color
  }
  
  const hash = sessionId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? colors[0] ?? 'gray-500';
}

export function generateColorPalette(): string[] {
  return [
    'blue-500',
    'green-500',
    'yellow-500',
    'purple-500',
    'pink-500',
    'indigo-500',
    'red-500',
    'orange-500',
    'teal-500',
    'cyan-500'
  ];
}

export function getContrastColor(bgColor: string): string {
  // Simple contrast calculation for text color
  const isLight = bgColor.includes('50') || bgColor.includes('100') || bgColor.includes('200');
  return isLight ? 'text-gray-900' : 'text-white';
}

export function applyThemeClass(theme: string): void {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.className = root.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ');
  
  // Add new theme class
  root.classList.add(`theme-${theme}`);
}

export function generateHexColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash >> 8) % 30);
  const lightness = 50 + (Math.abs(hash >> 16) % 20);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}