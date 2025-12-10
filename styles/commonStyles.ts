
import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Jagabans LA Website-inspired color scheme - Brown & Gold Premium
const colorSchemes = {
  default: {
    light: {
      background: '#1A1410', // Deep brown/black
      text: '#FFFFFF', // White text
      textSecondary: '#B8A888', // Light brown for descriptions
      primary: '#C9A961', // Gold accent
      secondary: '#8B7355', // Medium brown
      accent: '#D4AF37', // Bright gold accent
      card: '#2A2218', // Dark brown card
      highlight: '#E5C158', // Lighter gold
      border: '#C9A961', // Gold border
      // Gradient colors
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
    dark: {
      background: '#1A1410', // Deep brown/black
      text: '#FFFFFF', // White text
      textSecondary: '#B8A888', // Light brown for descriptions
      primary: '#C9A961', // Gold accent
      secondary: '#8B7355', // Medium brown
      accent: '#D4AF37', // Bright gold accent
      card: '#2A2218', // Dark brown card
      highlight: '#E5C158', // Lighter gold
      border: '#C9A961', // Gold border
      // Gradient colors
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
  },
  warm: {
    light: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
    dark: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
  },
  cool: {
    light: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
    dark: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
  },
  vibrant: {
    light: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
    dark: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
  },
  minimal: {
    light: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
    dark: {
      background: '#1A1410',
      text: '#FFFFFF',
      textSecondary: '#B8A888',
      primary: '#C9A961',
      secondary: '#8B7355',
      accent: '#D4AF37',
      card: '#2A2218',
      highlight: '#E5C158',
      border: '#C9A961',
      gradientStart: '#1A1410',
      gradientMid: '#2A2218',
      gradientEnd: '#4A3C28',
      headerGradientStart: '#1A1410',
      headerGradientEnd: '#3A2F1E',
      cardGradientStart: '#2A2218',
      cardGradientEnd: '#3A2F1E',
    },
  },
};

export const getColors = (mode: ThemeMode, colorScheme: ColorScheme, systemColorScheme: 'light' | 'dark' | null) => {
  const effectiveMode = mode === 'auto' ? (systemColorScheme || 'dark') : mode;
  return colorSchemes[colorScheme][effectiveMode];
};

// Default colors for backward compatibility
export const colors = colorSchemes.default.dark;

export const buttonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(201, 169, 97, 0.35)',
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(139, 115, 85, 0.35)',
    elevation: 8,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 0,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 8px 24px rgba(201, 169, 97, 0.25)',
    elevation: 8,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
