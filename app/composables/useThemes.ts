import type { 
  ThemeName, 
  CustomTheme, 
  PredefinedTheme, 
  ThemeState, 
  ThemeManagerState,
  CreateThemeFormData,
  ThemeColors,
  ThemeValidationResult,
  ThemeImportExport,
  ThemeApiResponse
} from '~/types/theme';
import { PREDEFINED_THEME_NAMES, COLOR_REGEX, RGBA_REGEX } from '~/types/theme';

// Predefined themes configuration
const PREDEFINED_THEMES: Record<ThemeName, PredefinedTheme> = {
  light: {
    name: 'light',
    displayName: 'Light',
    description: 'Clean and bright theme with high contrast',
    cssClass: 'theme-light',
    preview: { primary: '#ffffff', secondary: '#f9fafb', accent: '#3b82f6' },
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      primaryDark: '#1e40af',
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      bgQuaternary: '#e5e7eb',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textTertiary: '#6b7280',
      textQuaternary: '#9ca3af',
      borderPrimary: '#e5e7eb',
      borderSecondary: '#d1d5db',
      borderTertiary: '#9ca3af',
      accentSuccess: '#10b981',
      accentWarning: '#f59e0b',
      accentError: '#ef4444',
      accentInfo: '#3b82f6',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowLg: 'rgba(0, 0, 0, 0.25)',
      hoverBg: 'rgba(0, 0, 0, 0.05)',
      activeBg: 'rgba(0, 0, 0, 0.1)',
      focusRing: '#3b82f6'
    }
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    description: 'Dark theme with reduced eye strain',
    cssClass: 'theme-dark',
    preview: { primary: '#0f0f0f', secondary: '#111111', accent: '#60a5fa' },
    colors: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryLight: '#1e3a8a',
      primaryDark: '#1d4ed8',
      bgPrimary: '#0f0f0f',
      bgSecondary: '#111111',
      bgTertiary: '#1a1a1a',
      bgQuaternary: '#2a2a2a',
      textPrimary: '#f9fafb',
      textSecondary: '#e5e7eb',
      textTertiary: '#d1d5db',
      textQuaternary: '#9ca3af',
      borderPrimary: '#374151',
      borderSecondary: '#4b5563',
      borderTertiary: '#6b7280',
      accentSuccess: '#34d399',
      accentWarning: '#fbbf24',
      accentError: '#f87171',
      accentInfo: '#60a5fa',
      shadow: 'rgba(0, 0, 0, 0.5)',
      shadowLg: 'rgba(0, 0, 0, 0.75)',
      hoverBg: 'rgba(255, 255, 255, 0.05)',
      activeBg: 'rgba(255, 255, 255, 0.1)',
      focusRing: '#60a5fa'
    }
  },
  modern: {
    name: 'modern',
    displayName: 'Modern',
    description: 'Sleek modern theme with blue accents',
    cssClass: 'theme-modern',
    preview: { primary: '#f8fafc', secondary: '#f1f5f9', accent: '#0ea5e9' },
    colors: {
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      primaryLight: '#e0f2fe',
      primaryDark: '#0c4a6e',
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgTertiary: '#e2e8f0',
      bgQuaternary: '#cbd5e1',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textTertiary: '#64748b',
      textQuaternary: '#94a3b8',
      borderPrimary: '#e2e8f0',
      borderSecondary: '#cbd5e1',
      borderTertiary: '#94a3b8',
      accentSuccess: '#059669',
      accentWarning: '#d97706',
      accentError: '#dc2626',
      accentInfo: '#0ea5e9',
      shadow: 'rgba(15, 23, 42, 0.1)',
      shadowLg: 'rgba(15, 23, 42, 0.25)',
      hoverBg: 'rgba(15, 23, 42, 0.05)',
      activeBg: 'rgba(15, 23, 42, 0.1)',
      focusRing: '#0ea5e9'
    }
  },
  earth: {
    name: 'earth',
    displayName: 'Earth',
    description: 'Natural theme with warm earth tones',
    cssClass: 'theme-earth',
    preview: { primary: '#f5f5dc', secondary: '#d2b48c', accent: '#8b4513' },
    colors: {
      primary: '#8b4513',
      primaryHover: '#a0522d',
      primaryLight: '#deb887',
      primaryDark: '#654321',
      bgPrimary: '#f5f5dc',
      bgSecondary: '#f0e68c',
      bgTertiary: '#daa520',
      bgQuaternary: '#cd853f',
      textPrimary: '#2f1b14',
      textSecondary: '#5d4e37',
      textTertiary: '#8b4513',
      textQuaternary: '#a0522d',
      borderPrimary: '#deb887',
      borderSecondary: '#d2b48c',
      borderTertiary: '#cd853f',
      accentSuccess: '#228b22',
      accentWarning: '#ff8c00',
      accentError: '#dc143c',
      accentInfo: '#4682b4',
      shadow: 'rgba(139, 69, 19, 0.15)',
      shadowLg: 'rgba(139, 69, 19, 0.3)',
      hoverBg: 'rgba(139, 69, 19, 0.08)',
      activeBg: 'rgba(139, 69, 19, 0.15)',
      focusRing: '#8b4513'
    }
  },
  glass: {
    name: 'glass',
    displayName: 'Glass',
    description: 'Frosted glass theme with vibrant purple accents',
    cssClass: 'theme-glass',
    preview: { primary: '#e6e6fa', secondary: '#dda0dd', accent: '#9370db' },
    colors: {
      primary: '#9370db',
      primaryHover: '#8a2be2',
      primaryLight: '#e6e6fa',
      primaryDark: '#4b0082',
      bgPrimary: '#f8f8ff',
      bgSecondary: '#e6e6fa',
      bgTertiary: '#dda0dd',
      bgQuaternary: '#d8bfd8',
      textPrimary: '#2e1065',
      textSecondary: '#5b21b6',
      textTertiary: '#7c3aed',
      textQuaternary: '#8b5cf6',
      borderPrimary: '#dda0dd',
      borderSecondary: '#d8bfd8',
      borderTertiary: '#c8a2c8',
      accentSuccess: '#32cd32',
      accentWarning: '#ffa500',
      accentError: '#ff1493',
      accentInfo: '#9370db',
      shadow: 'rgba(147, 112, 219, 0.2)',
      shadowLg: 'rgba(147, 112, 219, 0.4)',
      hoverBg: 'rgba(147, 112, 219, 0.1)',
      activeBg: 'rgba(147, 112, 219, 0.2)',
      focusRing: '#9370db'
    }
  },
  'high-contrast': {
    name: 'high-contrast',
    displayName: 'High Contrast',
    description: 'Maximum contrast theme for accessibility',
    cssClass: 'theme-high-contrast',
    preview: { primary: '#ffffff', secondary: '#f0f0f0', accent: '#000000' },
    colors: {
      primary: '#000000',
      primaryHover: '#333333',
      primaryLight: '#f0f0f0',
      primaryDark: '#000000',
      bgPrimary: '#ffffff',
      bgSecondary: '#f0f0f0',
      bgTertiary: '#e0e0e0',
      bgQuaternary: '#d0d0d0',
      textPrimary: '#000000',
      textSecondary: '#000000',
      textTertiary: '#333333',
      textQuaternary: '#666666',
      borderPrimary: '#000000',
      borderSecondary: '#333333',
      borderTertiary: '#666666',
      accentSuccess: '#008000',
      accentWarning: '#ff8c00',
      accentError: '#ff0000',
      accentInfo: '#0000ff',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowLg: 'rgba(0, 0, 0, 0.6)',
      hoverBg: 'rgba(0, 0, 0, 0.1)',
      activeBg: 'rgba(0, 0, 0, 0.2)',
      focusRing: '#000000'
    }
  },
  'dark-blue': {
    name: 'dark-blue',
    displayName: 'Dark Blue',
    description: 'Professional dark blue theme',
    cssClass: 'theme-dark-blue',
    preview: { primary: '#1e293b', secondary: '#334155', accent: '#3b82f6' },
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      primaryDark: '#1d4ed8',
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      bgQuaternary: '#475569',
      textPrimary: '#f8fafc',
      textSecondary: '#e2e8f0',
      textTertiary: '#cbd5e1',
      textQuaternary: '#94a3b8',
      borderPrimary: '#334155',
      borderSecondary: '#475569',
      borderTertiary: '#64748b',
      accentSuccess: '#22c55e',
      accentWarning: '#f59e0b',
      accentError: '#ef4444',
      accentInfo: '#3b82f6',
      shadow: 'rgba(15, 23, 42, 0.5)',
      shadowLg: 'rgba(15, 23, 42, 0.8)',
      hoverBg: 'rgba(59, 130, 246, 0.1)',
      activeBg: 'rgba(59, 130, 246, 0.2)',
      focusRing: '#3b82f6'
    }
  },
  'colorblind-friendly': {
    name: 'colorblind-friendly',
    displayName: 'Colorblind Friendly',
    description: 'Accessible colors for colorblind users',
    cssClass: 'theme-colorblind-friendly',
    preview: { primary: '#ffffff', secondary: '#f3f4f6', accent: '#1f2937' },
    colors: {
      primary: '#1f2937',
      primaryHover: '#111827',
      primaryLight: '#f9fafb',
      primaryDark: '#000000',
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      bgQuaternary: '#e5e7eb',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textTertiary: '#6b7280',
      textQuaternary: '#9ca3af',
      borderPrimary: '#d1d5db',
      borderSecondary: '#9ca3af',
      borderTertiary: '#6b7280',
      accentSuccess: '#047857',
      accentWarning: '#d97706',
      accentError: '#dc2626',
      accentInfo: '#1e40af',
      shadow: 'rgba(31, 41, 55, 0.1)',
      shadowLg: 'rgba(31, 41, 55, 0.25)',
      hoverBg: 'rgba(31, 41, 55, 0.05)',
      activeBg: 'rgba(31, 41, 55, 0.1)',
      focusRing: '#1f2937'
    }
  },
  'ocean': {
    name: 'ocean',
    displayName: 'Ocean',
    description: 'Calming ocean-inspired theme',
    cssClass: 'theme-ocean',
    preview: { primary: '#e0f2fe', secondary: '#b3e5fc', accent: '#0277bd' },
    colors: {
      primary: '#0277bd',
      primaryHover: '#0288d1',
      primaryLight: '#e0f7fa',
      primaryDark: '#01579b',
      bgPrimary: '#f3fdfe',
      bgSecondary: '#e0f7fa',
      bgTertiary: '#b2ebf2',
      bgQuaternary: '#80deea',
      textPrimary: '#006064',
      textSecondary: '#00838f',
      textTertiary: '#0097a7',
      textQuaternary: '#00acc1',
      borderPrimary: '#b2ebf2',
      borderSecondary: '#80deea',
      borderTertiary: '#4dd0e1',
      accentSuccess: '#00695c',
      accentWarning: '#ef6c00',
      accentError: '#c62828',
      accentInfo: '#0277bd',
      shadow: 'rgba(2, 119, 189, 0.15)',
      shadowLg: 'rgba(2, 119, 189, 0.3)',
      hoverBg: 'rgba(2, 119, 189, 0.08)',
      activeBg: 'rgba(2, 119, 189, 0.15)',
      focusRing: '#0277bd'
    }
  },
};

export function useThemes() {
  // State
  const state = ref<ThemeState>({
    currentTheme: 'light',
    customThemes: [],
    isCustomTheme: false,
    isLoading: false,
    error: null
  });

  const managerState = ref<ThemeManagerState>({
    isOpen: false,
    activeTab: 'predefined',
    previewTheme: null,
    editingTheme: null
  });

  // Computed properties
  const currentThemeData = computed(() => {
    if (state.value.isCustomTheme) {
      return state.value.customThemes.find(t => t.id === state.value.currentTheme) ?? null;
    }
    return PREDEFINED_THEMES[state.value.currentTheme as ThemeName] ?? PREDEFINED_THEMES.light;
  });

  const predefinedThemes = computed(() => Object.values(PREDEFINED_THEMES));

  // Core theme management
  const setTheme = (theme: ThemeName | string) => {
    if (!process.client) return

    const isCustom = !PREDEFINED_THEME_NAMES.includes(theme as ThemeName);
    
    if (isCustom) {
      const customTheme = state.value.customThemes.find(t => t.id === theme);
      if (!customTheme) {
        console.error(`Custom theme not found: ${theme}`);
        return;
      }
      applyCustomTheme(customTheme);
    } else {
      applyPredefinedTheme(theme as ThemeName);
    }

    state.value.currentTheme = theme;
    state.value.isCustomTheme = isCustom;
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('isCustomTheme', isCustom.toString());
  };

  const applyPredefinedTheme = (themeName: ThemeName) => {
    if (!process.client) return

    // Remove all theme classes (including those with hyphens)
    document.documentElement.className = document.documentElement.className
      .replace(/theme-[\w-]+/g, '');
    
    // Add new theme class
    const themeData = PREDEFINED_THEMES[themeName];
    if (themeData) {
      document.documentElement.classList.add(themeData.cssClass);
      
      // For backward compatibility with existing dark mode
      if (themeName === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const applyCustomTheme = (theme: CustomTheme) => {
    if (!process.client) return

    // Remove all theme classes (including those with hyphens)
    document.documentElement.className = document.documentElement.className
      .replace(/theme-[\w-]+/g, '');
    
    // Apply custom CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = camelToKebab(key);
      root.style.setProperty(`--theme-${cssVar}`, value);
    });
    
    // Add custom theme class
    root.classList.add('theme-custom');
  };

  // Theme validation
  const validateTheme = (colors: Partial<ThemeColors>): ThemeValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(colors).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required`);
        return;
      }

      if (!isValidColor(value)) {
        errors.push(`${key} must be a valid color (hex, rgb, or rgba)`);
      }
    });

    // Check contrast ratios (simplified)
    if (colors.textPrimary && colors.bgPrimary) {
      const contrast = calculateContrast(colors.textPrimary, colors.bgPrimary);
      if (contrast < 4.5) {
        warnings.push('Primary text and background may not meet accessibility contrast requirements');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Auto theme switching
  const autoThemeEnabled = ref(false);
  
  const enableAutoTheme = () => {
    if (!process.client) return

    autoThemeEnabled.value = true;
    localStorage.setItem('autoTheme', 'true');
    applySystemTheme();
  };
  
  const disableAutoTheme = () => {
    if (!process.client) return

    autoThemeEnabled.value = false;
    localStorage.removeItem('autoTheme');
    // Keep the current theme when disabling auto
    const currentTheme = state.value.currentTheme;
    localStorage.setItem('theme', currentTheme);
  };
  
  const applySystemTheme = () => {
    if (!process.client) return

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  // Utility functions
  const camelToKebab = (str: string) => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const isValidColor = (color: string): boolean => {
    if (!process.client) return true
    try {
      return COLOR_REGEX.test(color) || RGBA_REGEX.test(color) || CSS.supports('color', color);
    } catch {
      return false;
    }
  };

  const calculateContrast = (_color1: string, _color2: string): number => {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    return 4.5; // Placeholder
  };

  // localStorage functions
  const saveCustomThemes = () => {
    if (!process.client) return
    localStorage.setItem('customThemes', JSON.stringify(state.value.customThemes));
  };

  const loadCustomThemes = () => {
    if (!process.client) return

    try {
      const stored = localStorage.getItem('customThemes');
      if (stored) {
        state.value.customThemes = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load custom themes from localStorage:', error);
      state.value.customThemes = [];
    }
  };

  // Initialization
  const initializeTheme = () => {
    if (!process.client) return

    loadCustomThemes();
    
    // Check if auto theme is enabled
    const autoTheme = localStorage.getItem('autoTheme');
    if (autoTheme === 'true') {
      autoThemeEnabled.value = true;
      applySystemTheme();
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (autoThemeEnabled.value) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      });
    } else {
      // Load saved theme
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Default to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  };

  // Initialize on mount (only on client)
  onMounted(() => {
    if (process.client) {
      initializeTheme();
    }
  });

  return {
    // State
    state: readonly(state),
    managerState,
    autoThemeEnabled: readonly(autoThemeEnabled),
    
    // Computed
    currentThemeData,
    predefinedThemes,
    
    // Core functions
    setTheme,
    validateTheme,
    
    // Auto theme
    enableAutoTheme,
    disableAutoTheme,
    applySystemTheme,
    
    // Utility
    initializeTheme
  };
}