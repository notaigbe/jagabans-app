import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Jagabans LA Website-inspired color scheme - Premium & Sophisticated
const colorSchemes = {
  default: {
    light: {
      background: '#0D1A2B', // Deep navy (almost black-blue)
      text: '#FFFFFF', // White text
      textSecondary: '#B0B8C1', // Light gray for descriptions
      primary: '#4AD7C2', // Turquoise/teal accent
      secondary: '#D4AF37', // Gold accent
      accent: '#D4AF37', // Gold accent
      card: '#1A2838', // Dark navy card
      highlight: '#E5C158', // Lighter gold
      border: '#D4AF37', // Gold border
      // Gradient colors
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
    dark: {
      background: '#0D1A2B', // Deep navy (almost black-blue)
      text: '#FFFFFF', // White text
      textSecondary: '#B0B8C1', // Light gray for descriptions
      primary: '#4AD7C2', // Turquoise/teal accent
      secondary: '#D4AF37', // Gold accent
      accent: '#D4AF37', // Gold accent
      card: '#1A2838', // Dark navy card
      highlight: '#E5C158', // Lighter gold
      border: '#D4AF37', // Gold border
      // Gradient colors
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
  },
  warm: {
    light: {
      background: '#0D1117',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
    dark: {
      background: '#0D1117',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
  },
  cool: {
    light: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
    dark: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
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
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
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
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
  },
  minimal: {
    light: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
    dark: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0B8C1',
      primary: '#4AD7C2',
      secondary: '#D4AF37',
      accent: '#D4AF37',
      card: '#1A2838',
      highlight: '#E5C158',
      border: '#D4AF37',
      gradientStart: '#0D1A2B',
      gradientMid: '#1A3A2E',
      gradientEnd: '#2A4A3E',
      headerGradientStart: '#0D1A2B',
      headerGradientEnd: '#1A3A2E',
      cardGradientStart: '#1A2838',
      cardGradientEnd: '#243848',
    },
  },
};

export const getColors = (mode: ThemeMode, colorScheme: ColorScheme, systemColorScheme: 'light' | 'dark' | null) => {
  const effectiveMode = mode === 'auto' ? (systemColorScheme || 'dark') : mode;
  return colorSchemes[colorScheme][effectiveMode];
};

// Default colors for backward compatibility - Gold-first palette
export const colors = colorSchemes.default.dark;

export const buttonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary, // Gold
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.35)',
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: colors.secondary, // Turquoise
    alignSelf: 'center',
    width: '100%',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.35)',
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
    fontSize: 32,
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
    fontFamily: 'Inter_400Regular',
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary, // Gold
    marginBottom: 8,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 0,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.25)',
    elevation: 8,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary, // Gold icon
  },
  badge: {
    backgroundColor: colors.primary, // Gold badge
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: colors.background, // Dark text on gold
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Inter_700Bold',
  },
});