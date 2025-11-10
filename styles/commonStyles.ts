
import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Color scheme definitions with teal and green as primary colors
const colorSchemes = {
  default: {
    light: {
      background: '#E0F2F1',
      text: '#004D40',
      textSecondary: '#00695C',
      primary: '#00897B',
      secondary: '#26A69A',
      accent: '#4DB6AC',
      card: '#FFFFFF',
      highlight: '#80CBC4',
    },
    dark: {
      background: '#0A1F1C',
      text: '#E0F2F1',
      textSecondary: '#80CBC4',
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      card: '#1A2F2C',
      highlight: '#4DB6AC',
    },
  },
  warm: {
    light: {
      background: '#FFF8E1',
      text: '#3E2723',
      textSecondary: '#6D4C41',
      primary: '#00897B',
      secondary: '#26A69A',
      accent: '#4DB6AC',
      card: '#FFFFFF',
      highlight: '#80CBC4',
    },
    dark: {
      background: '#1C1410',
      text: '#FAFAFA',
      textSecondary: '#BCAAA4',
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      card: '#2C2018',
      highlight: '#80CBC4',
    },
  },
  cool: {
    light: {
      background: '#E3F2FD',
      text: '#0D47A1',
      textSecondary: '#1565C0',
      primary: '#00897B',
      secondary: '#26A69A',
      accent: '#4DB6AC',
      card: '#FFFFFF',
      highlight: '#80CBC4',
    },
    dark: {
      background: '#0A1929',
      text: '#E3F2FD',
      textSecondary: '#90CAF9',
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      card: '#132F4C',
      highlight: '#80CBC4',
    },
  },
  vibrant: {
    light: {
      background: '#F3E5F5',
      text: '#4A148C',
      textSecondary: '#6A1B9A',
      primary: '#00897B',
      secondary: '#26A69A',
      accent: '#4DB6AC',
      card: '#FFFFFF',
      highlight: '#80CBC4',
    },
    dark: {
      background: '#1A0A1F',
      text: '#F3E5F5',
      textSecondary: '#CE93D8',
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      card: '#2A1A2F',
      highlight: '#80CBC4',
    },
  },
  minimal: {
    light: {
      background: '#FAFAFA',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#00897B',
      secondary: '#26A69A',
      accent: '#4DB6AC',
      card: '#FFFFFF',
      highlight: '#80CBC4',
    },
    dark: {
      background: '#121212',
      text: '#FAFAFA',
      textSecondary: '#B0B0B0',
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      card: '#1E1E1E',
      highlight: '#80CBC4',
    },
  },
};

export const getColors = (mode: ThemeMode, colorScheme: ColorScheme, systemColorScheme: 'light' | 'dark' | null) => {
  const effectiveMode = mode === 'auto' ? (systemColorScheme || 'light') : mode;
  return colorSchemes[colorScheme][effectiveMode];
};

// Default colors for backward compatibility
export const colors = colorSchemes.default.light;

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
