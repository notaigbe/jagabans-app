
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function CheckoutScreen() {
  const router = useRouter();
  const { currentColors, setTabBarVisible } = useApp();

  useEffect(() => {
    setTabBarVisible(false);
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Platform Not Supported',
        'Checkout is only available on iOS and Android mobile devices. Please use the mobile app to complete your purchase.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }

    return () => setTabBarVisible(true);
  }, [router, setTabBarVisible]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
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
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: currentColors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    button: {
      backgroundColor: currentColors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      color: currentColors.card,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  if (Platform.OS !== 'web') {
    // This should never render on native platforms
    // because checkout.native.tsx will be used instead
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <IconSymbol 
          name="exclamationmark.triangle.fill" 
          size={80} 
          color={currentColors.primary}
          style={styles.icon}
        />
        <Text style={styles.title}>
          Mobile Only Feature
        </Text>
        <Text style={styles.message}>
          Checkout is only available on iOS and Android mobile devices.{'\n'}
          Please download and use our mobile app to complete your purchase.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
