
import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Jagabans LA Website-inspired color scheme
const colorSchemes = {
  default: {
    light: {
      background: '#0D1A2B', // Deep navy (almost black-blue)
      text: '#FFFFFF', // White text
      textSecondary: '#B0B8C1', // Light gray for descriptions
      primary: '#4AD7C2', // Turquoise/teal accent
      secondary: '#D4AF37', // Gold accent
      accent: '#D4AF37', // Gold accent (changed from turquoise)
      card: '#1A2838', // Dark navy card
      highlight: '#E5C158', // Lighter gold
      border: '#D4AF37', // Gold border (changed from turquoise)
    },
    dark: {
      background: '#0D1A2B', // Deep navy (almost black-blue)
      text: '#FFFFFF', // White text
      textSecondary: '#B0B8C1', // Light gray for descriptions
      primary: '#4AD7C2', // Turquoise/teal accent
      secondary: '#D4AF37', // Gold accent
      accent: '#D4AF37', // Gold accent (changed from turquoise)
      card: '#1A2838', // Dark navy card
      highlight: '#E5C158', // Lighter gold
      border: '#D4AF37', // Gold border (changed from turquoise)
    },
  },
  warm: {
    light: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
    dark: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
  },
  cool: {
    light: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
    dark: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
  },
  vibrant: {
    light: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
    dark: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
  },
  minimal: {
    light: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
    },
    dark: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
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
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
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
    marginBottom: 10
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
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
