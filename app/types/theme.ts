export const PREDEFINED_THEME_NAMES = ['light', 'dark', 'modern', 'earth', 'glass', 'high-contrast', 'dark-blue', 'colorblind-friendly', 'ocean'] as const;
export type ThemeName = typeof PREDEFINED_THEME_NAMES[number];

export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
export const RGBA_REGEX = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgQuaternary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  borderPrimary: string;
  borderSecondary: string;
  borderTertiary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;
  accentInfo: string;
  shadow: string;
  shadowLg: string;
  hoverBg: string;
  activeBg: string;
  focusRing: string;
}

export interface PredefinedTheme {
  name: ThemeName;
  displayName: string;
  description: string;
  cssClass: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  colors: ThemeColors;
}

export interface CustomTheme {
  id?: string;
  name: string;
  displayName: string;
  description?: string;
  cssClass: string;
  colors: ThemeColors;
  isCustom: boolean;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeState {
  currentTheme: ThemeName | string;
  customThemes: CustomTheme[];
  isDark: boolean;
}

export interface ThemeManagerState {
  isOpen: boolean;
  activeSection: 'predefined' | 'custom' | 'create';
  createFormData: CreateThemeFormData;
  editingTheme: CustomTheme | null;
}

export interface CreateThemeFormData {
  name: string;
  displayName: string;
  description: string;
  colors: Partial<ThemeColors>;
  baseTheme?: ThemeName;
  isPublic: boolean;
}

export interface ThemeValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ThemeImportExport {
  version: string;
  theme: CustomTheme;
  exportedAt: string;
}

export interface ThemeApiResponse {
  themes?: CustomTheme[];
  theme?: CustomTheme;
  error?: string;
  message?: string;
}