
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { currentColors } = useApp();

  useEffect(() => {
    // Redirect to native version if on mobile
    if (Platform.OS !== 'web') {
      router.replace('/payment-methods');
    }
  }, [router]);

  const styles = StyleSheet.create({
    gradientContainer: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    icon: {
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: currentColors.text,
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    message: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    button: {
      borderRadius: 0,
      boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
      elevation: 8,
    },
    buttonInner: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: currentColors.background,
    },
  });

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.container}>
          <IconSymbol 
            name="exclamationmark.triangle.fill" 
            size={80} 
            color={currentColors.secondary}
            style={styles.icon}
          />
          <Text style={styles.title}>
            Mobile Only Feature
          </Text>
          <Text style={styles.message}>
            Payment method management is only available on iOS and Android mobile devices due to native payment processing requirements.{'\n\n'}
            Please use our mobile app to add or manage your payment methods.
          </Text>
          <LinearGradient
            colors={[currentColors.secondary, currentColors.highlight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.buttonInner}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
