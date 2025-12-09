import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { ThemeMode, ColorScheme } from '@/types';
import { themeService } from '@/services/supabaseService';

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { themeSettings, updateThemeMode, updateColorScheme, currentColors } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const themeModes: { value: ThemeMode; label: string; icon: string; description: string }[] = [
    { value: 'light', label: 'Light', icon: 'sun.max.fill', description: 'Bright and clean interface' },
    { value: 'dark', label: 'Dark', icon: 'moon.fill', description: 'Easy on the eyes at night' },
    { value: 'auto', label: 'Auto', icon: 'auto-mode', description: 'Follows system settings' },
  ];

  const colorSchemes: { value: ColorScheme; label: string; description: string; colors: string[] }[] = [
    { 
      value: 'default', 
      label: 'Default', 
      description: 'Warm orange tones inspired by West African cuisine',
      colors: ['#E64A19', '#F57C00', '#FFB74D']
    },
    { 
      value: 'warm', 
      label: 'Warm Sunset', 
      description: 'Rich earthy tones with deep oranges',
      colors: ['#D84315', '#F4511E', '#FF8A65']
    },
    { 
      value: 'cool', 
      label: 'Cool Ocean', 
      description: 'Calming blues and aqua tones',
      colors: ['#1976D2', '#42A5F5', '#64B5F6']
    },
    { 
      value: 'vibrant', 
      label: 'Vibrant Purple', 
      description: 'Bold and energetic purple hues',
      colors: ['#7B1FA2', '#AB47BC', '#CE93D8']
    },
    { 
      value: 'minimal', 
      label: 'Minimal Gray', 
      description: 'Clean and sophisticated grayscale',
      colors: ['#424242', '#616161', '#9E9E9E']
    },
  ];

  const handleThemeModeChange = async (mode: ThemeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // AppContext handles both local update and Supabase save
    await updateThemeMode(mode);
  };

  const handleColorSchemeChange = async (scheme: ColorScheme) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // AppContext handles both local update and Supabase save
    await updateColorScheme(scheme);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.text,
      flex: 1,
    },
    savingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    savingText: {
      fontSize: 12,
      color: currentColors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 16,
    },
    sectionDescription: {
      fontSize: 14,
      color: currentColors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    optionCard: {
      backgroundColor: currentColors.card,
      borderRadius: 0,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    optionCardSelected: {
      borderWidth: 2,
      borderColor: currentColors.primary,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: currentColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: currentColors.textSecondary,
      lineHeight: 18,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: currentColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorSchemeCard: {
      backgroundColor: currentColors.card,
      borderRadius: 0,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    colorSchemeCardSelected: {
      borderWidth: 2,
      borderColor: currentColors.primary,
    },
    colorSchemeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    colorSchemeInfo: {
      flex: 1,
    },
    colorSchemeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
      marginBottom: 4,
    },
    colorSchemeDescription: {
      fontSize: 14,
      color: currentColors.textSecondary,
      lineHeight: 18,
    },
    colorPreview: {
      flexDirection: 'row',
      gap: 8,
    },
    colorCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: currentColors.background,
    },
    previewSection: {
      marginTop: 8,
      padding: 16,
      backgroundColor: currentColors.background,
      borderRadius: 8,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: currentColors.text,
      marginBottom: 8,
    },
    previewRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    previewChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: currentColors.primary,
    },
    previewChipText: {
      fontSize: 12,
      color: currentColors.card,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <IconSymbol name="chevron.left" size={20} color={currentColors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Theme Settings</Text>
          {isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={currentColors.primary} />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theme Mode</Text>
            <Text style={styles.sectionDescription}>
              Choose how the app looks. Auto mode follows your device settings.
            </Text>
            {themeModes.map((mode) => (
              <Pressable
                key={mode.value}
                style={[
                  styles.optionCard,
                  themeSettings.mode === mode.value && styles.optionCardSelected,
                ]}
                onPress={() => handleThemeModeChange(mode.value)}
                disabled={isSaving}
              >
                <View style={styles.optionIcon}>
                  <IconSymbol 
                    name={mode.icon} 
                    size={24} 
                    color={themeSettings.mode === mode.value ? currentColors.primary : currentColors.textSecondary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{mode.label}</Text>
                  <Text style={styles.optionDescription}>{mode.description}</Text>
                </View>
                {themeSettings.mode === mode.value && (
                  <View style={styles.checkIcon}>
                    <IconSymbol name="checkmark" size={16} color={currentColors.card} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Color Scheme Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Scheme</Text>
            <Text style={styles.sectionDescription}>
              Select a color palette that matches your style.
            </Text>
            {colorSchemes.map((scheme) => (
              <Pressable
                key={scheme.value}
                style={[
                  styles.colorSchemeCard,
                  themeSettings.colorScheme === scheme.value && styles.colorSchemeCardSelected,
                ]}
                onPress={() => handleColorSchemeChange(scheme.value)}
                disabled={isSaving}
              >
                <View style={styles.colorSchemeHeader}>
                  <View style={styles.colorSchemeInfo}>
                    <Text style={styles.colorSchemeLabel}>{scheme.label}</Text>
                    <Text style={styles.colorSchemeDescription}>{scheme.description}</Text>
                  </View>
                  <View style={styles.colorPreview}>
                    {scheme.colors.map((color, index) => (
                      <View
                        key={index}
                        style={[styles.colorCircle, { backgroundColor: color }]}
                      />
                    ))}
                  </View>
                </View>
                {themeSettings.colorScheme === scheme.value && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>Preview</Text>
                    <View style={styles.previewRow}>
                      <View style={styles.previewChip}>
                        <Text style={styles.previewChipText}>Primary</Text>
                      </View>
                      <View style={[styles.previewChip, { backgroundColor: currentColors.secondary }]}>
                        <Text style={styles.previewChipText}>Secondary</Text>
                      </View>
                      <View style={[styles.previewChip, { backgroundColor: currentColors.accent }]}>
                        <Text style={styles.previewChipText}>Accent</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}