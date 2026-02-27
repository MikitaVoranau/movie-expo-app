import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#FFFFFF',
    elevated: '#FFFFFF',

    // Text
    text: '#000000',
    textSecondary: '#333333',
    textMuted: '#666666',

    // Accents
    accent: '#E50914',
    accentGold: '#C8A200',
    accentGoldMuted: '#8B7000',

    // Tab bar
    tint: '#E50914',
    tabIconDefault: '#666666',
    tabIconSelected: '#E50914',

    // Semantic
    icon: '#333333',
    border: '#E5E5E5',
    overlay: 'transparent',
    gradientStart: 'transparent',
    gradientEnd: 'transparent',
  },
  dark: {
    // Backgrounds
    background: '#000000',
    surface: '#111111',
    surfaceVariant: '#1A1A1A',
    elevated: '#252525',

    // Text
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',

    // Accents
    accent: '#E50914',
    accentGold: '#FFD700',
    accentGoldMuted: '#B8960C',

    // Tab bar
    tint: '#E50914',
    tabIconDefault: '#666666',
    tabIconSelected: '#E50914',

    // Semantic
    icon: '#CCCCCC',
    border: '#333333',
    overlay: 'transparent',
    gradientStart: 'transparent',
    gradientEnd: 'transparent',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
