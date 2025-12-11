
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Toast from '@/components/Toast';
import {
  useFonts as useGoogleFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black,
} from '@expo-google-fonts/playfair-display';
import {
  Cormorant_400Regular,
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold,
} from '@expo-google-fonts/cormorant';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [googleFontsLoaded] = useGoogleFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    Cormorant_400Regular,
    Cormorant_500Medium,
    Cormorant_600SemiBold,
    Cormorant_700Bold,
  });

  useEffect(() => {
    if (loaded && googleFontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, googleFontsLoaded]);

  if (!loaded || !googleFontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="website" options={{ headerShown: false }} />
            <Stack.Screen 
              name="item-detail" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="checkout" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="merch-redemption" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="order-history" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="edit-profile" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="payment-methods" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="notifications" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="events" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="theme-settings" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="modal" 
              options={{ 
                presentation: 'modal',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="formsheet" 
              options={{ 
                presentation: 'formSheet',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="transparent-modal" 
              options={{ 
                presentation: 'transparentModal',
                headerShown: false,
              }} 
            />
          </Stack>
          <StatusBar style="light" />
          <Toast />
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
