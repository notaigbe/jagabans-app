import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { ColorScheme, ThemeMode } from '@/types';

// Jagabans LA Premium color scheme with Gold accents
const colorSchemes = {
  default: {
    light: {
      background: '#0A0E27', // Deep navy (Jagabans primary)
      text: '#FFFFFF', // Pure white text
      textSecondary: '#E5C158', // Light gold for descriptions
      primary: '#D4AF37', // Rich gold accent (primary)
      secondary: '#4AD7C2', // Turquoise accent (secondary)
      accent: '#E5C158', // Light gold
      card: '#1A2838', // Dark navy card
      highlight: '#F5E6C8', // Pale gold highlight
      border: '#B8975A', // Muted gold border
      success: '#4AD7C2', // Turquoise for success states
      cardDark: '#0D1117', // Darker card variant
    },
    dark: {
      background: '#0A0E27', // Deep navy (Jagabans primary)
      text: '#FFFFFF', // Pure white text
      textSecondary: '#E5C158', // Light gold for descriptions
      primary: '#D4AF37', // Rich gold accent (primary)
      secondary: '#4AD7C2', // Turquoise accent (secondary)
      accent: '#E5C158', // Light gold
      card: '#1A2838', // Dark navy card
      highlight: '#F5E6C8', // Pale gold highlight
      border: '#B8975A', // Muted gold border
      success: '#4AD7C2', // Turquoise for success states
      cardDark: '#0D1117', // Darker card variant
    },
  },
  warm: {
    light: {
      background: '#0D1117',
      text: '#FFFFFF',
      textSecondary: '#F5E6C8',
      primary: '#E5C158', // Lighter gold for warm
      secondary: '#D4AF37', // Rich gold
      accent: '#F5E6C8',
      card: '#1A1F2E',
      highlight: '#FFF8E7',
      border: '#C9A961',
      success: '#5FE3CE',
      cardDark: '#0A0E27',
    },
    dark: {
      background: '#0D1117',
      text: '#FFFFFF',
      textSecondary: '#F5E6C8',
      primary: '#E5C158', // Lighter gold for warm
      secondary: '#D4AF37', // Rich gold
      accent: '#F5E6C8',
      card: '#1A1F2E',
      highlight: '#FFF8E7',
      border: '#C9A961',
      success: '#5FE3CE',
      cardDark: '#0A0E27',
    },
  },
  cool: {
    light: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0C4DE',
      primary: '#4AD7C2', // Turquoise primary for cool
      secondary: '#D4AF37', // Gold secondary
      accent: '#5FE3CE',
      card: '#1A2838',
      highlight: '#E0F2F1',
      border: '#4AD7C2',
      success: '#4AD7C2',
      cardDark: '#0D1A2B',
    },
    dark: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B0C4DE',
      primary: '#4AD7C2', // Turquoise primary for cool
      secondary: '#D4AF37', // Gold secondary
      accent: '#5FE3CE',
      card: '#1A2838',
      highlight: '#E0F2F1',
      border: '#4AD7C2',
      success: '#4AD7C2',
      cardDark: '#0D1A2B',
    },
  },
  vibrant: {
    light: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#FFD700',
      primary: '#FFD700', // Bright gold for vibrant
      secondary: '#00E5CC', // Bright turquoise
      accent: '#FFA500', // Orange accent
      card: '#1A2838',
      highlight: '#FFFACD',
      border: '#FFD700',
      success: '#00E5CC',
      cardDark: '#121826',
    },
    dark: {
      background: '#0D1A2B',
      text: '#FFFFFF',
      textSecondary: '#FFD700',
      primary: '#FFD700', // Bright gold for vibrant
      secondary: '#00E5CC', // Bright turquoise
      accent: '#FFA500', // Orange accent
      card: '#1A2838',
      highlight: '#FFFACD',
      border: '#FFD700',
      success: '#00E5CC',
      cardDark: '#121826',
    },
  },
  minimal: {
    light: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B8975A',
      primary: '#B8975A', // Muted gold for minimal
      secondary: '#D4AF37', // Standard gold
      accent: '#C9A961',
      card: '#121826',
      highlight: '#E5DCC8',
      border: '#3A3F4F',
      success: '#69C9BA',
      cardDark: '#0D1117',
    },
    dark: {
      background: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#B8975A',
      primary: '#B8975A', // Muted gold for minimal
      secondary: '#D4AF37', // Standard gold
      accent: '#C9A961',
      card: '#121826',
      highlight: '#E5DCC8',
      border: '#3A3F4F',
      success: '#69C9BA',
      cardDark: '#0D1117',
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: 'PlayfairDisplay_700Bold', // Premium serif
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textSecondary, // Gold
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
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
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    shadowColor: colors.primary, // Gold shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDark: {
    backgroundColor: colors.cardDark,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1.5,
    width: 100,
    backgroundColor: colors.primary, // Gold divider
    marginVertical: 16,
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