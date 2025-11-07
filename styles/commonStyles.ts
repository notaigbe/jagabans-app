
import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Color scheme definitions
const colorSchemes = {
  default: {
    light: {
      background: '#FFF3E0',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#E64A19',
      secondary: '#F57C00',
      accent: '#FFB74D',
      card: '#FFFFFF',
      highlight: '#FFD54F',
    },
    dark: {
      background: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      primary: '#FF6E40',
      secondary: '#FF9800',
      accent: '#FFB74D',
      card: '#2A2A2A',
      highlight: '#FFD54F',
    },
  },
  warm: {
    light: {
      background: '#FFF8E1',
      text: '#3E2723',
      textSecondary: '#6D4C41',
      primary: '#D84315',
      secondary: '#F4511E',
      accent: '#FF8A65',
      card: '#FFFFFF',
      highlight: '#FFAB91',
    },
    dark: {
      background: '#1C1410',
      text: '#FAFAFA',
      textSecondary: '#BCAAA4',
      primary: '#FF6E40',
      secondary: '#FF7043',
      accent: '#FF8A65',
      card: '#2C2018',
      highlight: '#FFAB91',
    },
  },
  cool: {
    light: {
      background: '#E3F2FD',
      text: '#0D47A1',
      textSecondary: '#1565C0',
      primary: '#1976D2',
      secondary: '#42A5F5',
      accent: '#64B5F6',
      card: '#FFFFFF',
      highlight: '#90CAF9',
    },
    dark: {
      background: '#0A1929',
      text: '#E3F2FD',
      textSecondary: '#90CAF9',
      primary: '#42A5F5',
      secondary: '#64B5F6',
      accent: '#90CAF9',
      card: '#132F4C',
      highlight: '#BBDEFB',
    },
  },
  vibrant: {
    light: {
      background: '#F3E5F5',
      text: '#4A148C',
      textSecondary: '#6A1B9A',
      primary: '#7B1FA2',
      secondary: '#AB47BC',
      accent: '#CE93D8',
      card: '#FFFFFF',
      highlight: '#E1BEE7',
    },
    dark: {
      background: '#1A0A1F',
      text: '#F3E5F5',
      textSecondary: '#CE93D8',
      primary: '#AB47BC',
      secondary: '#BA68C8',
      accent: '#CE93D8',
      card: '#2A1A2F',
      highlight: '#E1BEE7',
    },
  },
  minimal: {
    light: {
      background: '#FAFAFA',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#424242',
      secondary: '#616161',
      accent: '#9E9E9E',
      card: '#FFFFFF',
      highlight: '#BDBDBD',
    },
    dark: {
      background: '#121212',
      text: '#FAFAFA',
      textSecondary: '#B0B0B0',
      primary: '#E0E0E0',
      secondary: '#BDBDBD',
      accent: '#9E9E9E',
      card: '#1E1E1E',
      highlight: '#757575',
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
