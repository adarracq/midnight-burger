import { Platform } from 'react-native';

export const Colors = {
  // Textes
  text: '#FFFFFF', // Blanc pur pour contraster avec le dark mode
  textMuted: 'rgba(235, 235, 245, 0.6)', // Gris iOS translucide

  // Fonds & Effet Glassmorphism
  background: '#000000', // Noir profond indispensable pour le rendu premium
  backgroundLight: '#1C1C1E', // Noir légèrement plus clair pour les surfaces secondaires
  surface: 'rgba(255, 255, 255, 0.08)', // Surface verre (semi-transparente)
  surfaceLight: 'rgba(255, 255, 255, 0.15)', // Surface verre plus claire
  surfaceBorder: 'rgba(255, 255, 255, 0.15)', // Bordure brillante très fine

  // Couleurs de marque
  primary: '#F5E134', // Jaune légèrement plus pimpant pour le premium
  primaryMuted: 'rgba(245, 225, 52, 0.15)',
  tint: '#FFFFFF',
  icon: 'rgba(235, 235, 245, 0.6)',

  // États
  error: '#FF453A', // Rouge iOS natif
  success: '#4E8A75',    // Vert sauge lumineux pour une bonne réponse
  warning: '#E8A74D',    // Ocre jaune lumineux pour les indices
  info: '#5D8ACD',

  // Rangs
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D4AF37',
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