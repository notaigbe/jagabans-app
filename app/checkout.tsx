
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import { SUPABASE_URL, supabase } from '@/app/integrations/supabase/client';

// Types
interface AddressValidationResult {
  success: boolean;
  isValid: boolean;
  formattedAddress?: string;
  addressComponents?: {
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  confidence?: 'high' | 'medium' | 'low';
  suggestions?: string[];
  error?: string;
}

interface PaymentResult {
  success: boolean;
  payment?: any;
  checkout?: any;
  error?: any;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { 
    cart, 
    userProfile, 
    currentColors, 
    setTabBarVisible,
    clearCart,
    loadUserProfile
  } = useApp();

  // State
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'web'>('card');
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Computed values
  const availablePoints = userProfile?.points || 0;
  const hasSavedCards = userProfile?.paymentMethods && userProfile.paymentMethods.length > 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(availablePoints * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  // Effects
  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (userProfile?.paymentMethods && userProfile.paymentMethods.length > 0) {
      const defaultCard = userProfile.paymentMethods.find(pm => pm.isDefault);
      setSelectedCardId(defaultCard?.id || userProfile.paymentMethods[0].id);
    }
  }, [userProfile?.paymentMethods]);

  useEffect(() => {
    if (!addressTouched) return;
    const timeoutId = setTimeout(() => validateAddress(deliveryAddress), 1000);
    return () => clearTimeout(timeoutId);
  }, [deliveryAddress, addressTouched]);

  // Helper functions
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const parseAddress = (address: string) => {
    if (addressValidation?.addressComponents) {
      return {
        address: `${addressValidation.addressComponents.streetNumber || ''} ${addressValidation.addressComponents.street || ''}`.trim(),
        city: addressValidation.addressComponents.city || '',
        state: addressValidation.addressComponents.state || '',
        zip: addressValidation.addressComponents.postalCode || '',
      };
    }
    
    const parts = address.split(',').map(p => p.trim());
    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2]?.split(' ')[0] || '',
      zip: parts[2]?.split(' ')[1] || '',
    };
  };

  const getAddressValidationColor = () => {
    if (!addressValidation) return currentColors.textSecondary;
    if (!addressValidation.isValid) return '#EF4444';
    if (addressValidation.confidence === 'high') return '#10B981';
    if (addressValidation.confidence === 'medium') return '#F59E0B';
    return '#EF4444';
  };

  const getAddressValidationIcon = () => {
    if (isValidatingAddress) return 'hourglass';
    if (!addressValidation) return 'location-pin';
    if (!addressValidation.isValid) return 'xmark.circle.fill';
    if (addressValidation.confidence === 'high') return 'checkmark.circle.fill';
    if (addressValidation.confidence === 'medium') return 'exclamationmark.triangle.fill';
    return 'xmark.circle.fill';
  };

  const getAddressValidationMessage = () => {
    if (isValidatingAddress) return 'Validating address...';
    if (!addressValidation) return '';
    if (!addressValidation.isValid) return 'Address could not be verified. Please check for errors.';
    if (addressValidation.confidence === 'high') return 'Address verified ✓';
    if (addressValidation.confidence === 'medium') return 'Address partially verified. Please review.';
    return 'Address verification failed.';
  };

  // Address validation
  const validateAddress = useCallback(async (address: string) => {
    if (!address || address.trim().length < 5) {
      setAddressValidation(null);
      return;
    }

    setIsValidatingAddress(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ address }),
      });

      const result: AddressValidationResult = await response.json();
      console.log('Address validation result:', result);
      
      setAddressValidation(result);
      
      if (result.isValid && result.formattedAddress && result.confidence === 'high') {
        setValidatedAddress(result.formattedAddress);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressValidation({
        success: false,
        isValid: false,
        error: 'Failed to validate address',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  }, []);

  const useFormattedAddress = () => {
    if (addressValidation?.formattedAddress) {
      setDeliveryAddress(addressValidation.formattedAddress);
      setValidatedAddress(addressValidation.formattedAddress);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Payment processing
  const processSquarePayment = async (): Promise<PaymentResult> => {
    try {
      console.log('Starting Square payment process...');
      
      if (!userProfile) throw new Error('User profile not found');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get authentication session. Please try logging in again.');
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('You are not logged in. Please log in and try again.');
      }

      console.log('Session obtained, calling Edge Function...');

      const addressParts = parseAddress(validatedAddress || deliveryAddress);
      const sourceId = 'cnon:card-nonce-ok'; // Square sandbox test nonce
      const amountInCents = Math.round(total * 100);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-square-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceId,
          amount: amountInCents,
          currency: 'USD',
          customer: {
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            address: addressParts.address,
            city: addressParts.city,
            state: addressParts.state,
            zip: addressParts.zip,
          },
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      console.log('Edge Function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Payment processing failed');
        } catch (parseError) {
          throw new Error(`Payment failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Payment result:', result);

      if (!result.success) throw new Error(result.error || 'Payment failed');

      return { success: true, payment: result };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error };
    }
  };

  const createSquareCheckout = async (): Promise<PaymentResult> => {
    try {
      console.log('Starting Square checkout creation...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get authentication session. Please try logging in again.');
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('You are not logged in. Please log in and try again.');
      }

      console.log('Session obtained, calling Edge Function...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-square-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress,
          pickupNotes,
          redirectUrl: 'https://natively.dev/order-confirmation',
        }),
      });

      console.log('Edge Function response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Checkout creation failed');
        } catch (parseError) {
          throw new Error(`Checkout creation failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Checkout result:', result);

      if (!result.success) throw new Error(result.error || 'Checkout creation failed');

      return { success: true, checkout: result.checkout };
    } catch (error) {
      console.error('Checkout creation error:', error);
      return { success: false, error };
    }
  };

  // Order handling
  const handlePlaceOrder = async () => {
    console.log('Placing order with Square');
    
    if (!deliveryAddress.trim()) {
      showToast('error', 'Please enter a delivery address.');
      return;
    }

    if (addressTouched && addressValidation) {
      if (!addressValidation.isValid) {
        Alert.alert(
          'Address Verification',
          'The address you entered could not be verified. Please check and correct your address before continuing.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (addressValidation.confidence === 'low') {
        Alert.alert(
          'Address Verification',
          'The address you entered has low confidence. We recommend reviewing it for accuracy.',
          [
            { text: 'Review Address', style: 'cancel' },
            { 
              text: 'Continue Anyway', 
              onPress: () => proceedWithOrder(),
              style: 'destructive'
            }
          ]
        );
        return;
      }
    }

    await proceedWithOrder();
  };

  const proceedWithOrder = async () => {
    if (paymentMethod === 'card' && !hasSavedCards) {
      showToast('error', 'Please add a payment method before placing an order.');
      return;
    }

    if (paymentMethod === 'card' && !selectedCardId) {
      showToast('error', 'Please select a payment method.');
      return;
    }

    setProcessing(true);

    try {
      let paymentResult: PaymentResult;

      if (paymentMethod === 'web') {
        paymentResult = await createSquareCheckout();
        
        if (paymentResult.success && paymentResult.checkout) {
          if (Platform.OS === 'web') {
            window.open(paymentResult.checkout.url, '_blank');
          } else {
            Alert.alert(
              'Complete Payment',
              'You will be redirected to Square to complete your payment.',
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    console.log('Open checkout URL:', paymentResult.checkout.url);
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
          
          showToast('info', 'Redirecting to Square checkout...');
          setProcessing(false);
          return;
        } else {
          const errorMessage = paymentResult.error instanceof Error 
            ? paymentResult.error.message 
            : 'Failed to create checkout';
          showToast('error', errorMessage);
          setProcessing(false);
          return;
        }
      } else {
        paymentResult = await processSquarePayment();
      }

      if (!paymentResult.success) {
        const errorMessage = paymentResult.error instanceof Error 
          ? paymentResult.error.message 
          : 'There was an issue processing your payment. Please try again.';
        showToast('error', errorMessage);
        setProcessing(false);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      await loadUserProfile();
      
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully!\n\nOrder #${paymentResult.payment.orderNumber || 'N/A'}\nPayment ID: ${paymentResult.payment.paymentId || 'N/A'}\n\nYou earned ${paymentResult.payment.pointsEarned || 0} points!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to place order. Please try again.';
      showToast('error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
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
    infoBanner: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    inputContainer: {
      position: 'relative',
    },
    input: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 80,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
      paddingRight: 48,
    },
    inputWithValidation: {
      borderWidth: 2,
    },
    validationIconContainer: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    validationMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
      paddingHorizontal: 4,
    },
    validationMessageText: {
      fontSize: 13,
      flex: 1,
    },
    formattedAddressSuggestion: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    suggestionAddress: {
      fontSize: 14,
      marginBottom: 8,
      lineHeight: 20,
    },
    useSuggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 6,
      gap: 6,
    },
    useSuggestionButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    paymentMethodSection: {
      gap: 12,
    },
    paymentTypeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    paymentTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      gap: 8,
    },
    paymentTypeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    savedCardsContainer: {
      gap: 12,
    },
    savedCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    savedCardInfo: {
      flex: 1,
    },
    savedCardNumber: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    savedCardExpiry: {
      fontSize: 14,
      opacity: 0.7,
    },
    savedCardDefault: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    manageCardsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    manageCardsText: {
      fontSize: 14,
      fontWeight: '600',
    },
    noCardsContainer: {
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      gap: 12,
    },
    noCardsText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 4,
    },
    noCardsSubtext: {
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.7,
      marginBottom: 8,
    },
    addCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    addCardButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    secureLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingLeft: 4,
    },
    secureLabelText: {
      fontSize: 12,
      opacity: 0.7,
    },
    pointsToggle: {
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    pointsToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    pointsToggleInfo: {
      flex: 1,
    },
    pointsToggleTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    pointsToggleSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryCard: {
      borderRadius: 12,
      padding: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
    },
    summaryValue: {
      fontSize: 16,
    },
    summaryRowTotal: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 4,
    },
    summaryLabelTotal: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    summaryValueTotal: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    pointsEarnCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    pointsEarnText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
    },
    placeOrderButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    placeOrderButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          style={styles.backButton}
        >
          <IconSymbol name="chevron-left" size={24} color={currentColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.infoBanner, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Secure checkout powered by Square. Your payment information is encrypted and protected.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Address *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithValidation,
                  { 
                    backgroundColor: currentColors.card, 
                    color: currentColors.text,
                    borderColor: addressTouched && addressValidation 
                      ? getAddressValidationColor()
                      : currentColors.border,
                  }
                ]}
                placeholder="Enter your full delivery address (street, city, state, ZIP)"
                placeholderTextColor={currentColors.textSecondary}
                value={deliveryAddress}
                onChangeText={(text) => {
                  setDeliveryAddress(text);
                  setAddressTouched(true);
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!processing}
              />
              {addressTouched && (
                <View style={styles.validationIconContainer}>
                  {isValidatingAddress ? (
                    <ActivityIndicator size="small" color={currentColors.primary} />
                  ) : (
                    <IconSymbol 
                      name={getAddressValidationIcon()} 
                      size={24} 
                      color={getAddressValidationColor()} 
                    />
                  )}
                </View>
              )}
            </View>
            
            {addressTouched && addressValidation && (
              <View style={styles.validationMessage}>
                <Text style={[
                  styles.validationMessageText, 
                  { color: getAddressValidationColor() }
                ]}>
                  {getAddressValidationMessage()}
                </Text>
              </View>
            )}

            {addressValidation?.isValid && 
             addressValidation.formattedAddress && 
             addressValidation.formattedAddress !== deliveryAddress && (
              <View style={[
                styles.formattedAddressSuggestion,
                { 
                  backgroundColor: currentColors.card,
                  borderColor: currentColors.primary + '40',
                }
              ]}>
                <View style={styles.suggestionHeader}>
                  <IconSymbol name="lightbulb.fill" size={16} color={currentColors.primary} />
                  <Text style={[styles.suggestionTitle, { color: currentColors.text }]}>
                    Suggested Address
                  </Text>
                </View>
                <Text style={[styles.suggestionAddress, { color: currentColors.textSecondary }]}>
                  {addressValidation.formattedAddress}
                </Text>
                <Pressable
                  style={[
                    styles.useSuggestionButton,
                    { backgroundColor: currentColors.primary }
                  ]}
                  onPress={useFormattedAddress}
                >
                  <IconSymbol name="checkmark" size={14} color={currentColors.card} />
                  <Text style={[styles.useSuggestionButtonText, { color: currentColors.card }]}>
                    Use This Address
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Pickup Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Add any special instructions for pickup..."
              placeholderTextColor={currentColors.textSecondary}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!processing}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Payment Method</Text>
            
            <View style={styles.paymentTypeSelector}>
              <Pressable
                style={[
                  styles.paymentTypeButton,
                  {
                    backgroundColor: paymentMethod === 'card' ? currentColors.primary : currentColors.card,
                    borderColor: paymentMethod === 'card' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaymentMethod('card');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="credit-card" 
                  size={20} 
                  color={paymentMethod === 'card' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.paymentTypeText, 
                  { color: paymentMethod === 'card' ? currentColors.card : currentColors.text }
                ]}>
                  Saved Card
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.paymentTypeButton,
                  {
                    backgroundColor: paymentMethod === 'web' ? currentColors.primary : currentColors.card,
                    borderColor: paymentMethod === 'web' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaymentMethod('web');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="web-stories" 
                  size={20} 
                  color={paymentMethod === 'web' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.paymentTypeText, 
                  { color: paymentMethod === 'web' ? currentColors.card : currentColors.text }
                ]}>
                  Web Checkout
                </Text>
              </Pressable>
            </View>

            {paymentMethod === 'card' ? (
              hasSavedCards ? (
                <View style={styles.paymentMethodSection}>
                  <View style={styles.savedCardsContainer}>
                    {userProfile?.paymentMethods?.map((card) => (
                      <Pressable
                        key={card.id}
                        style={[
                          styles.savedCardItem,
                          {
                            backgroundColor: currentColors.card,
                            borderColor: selectedCardId === card.id ? currentColors.primary : currentColors.border,
                          }
                        ]}
                        onPress={() => {
                          if (!processing) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCardId(card.id);
                          }
                        }}
                        disabled={processing}
                      >
                        <IconSymbol 
                          name={card.type === 'credit' ? 'credit-card' : 'banknote.fill'} 
                          size={24} 
                          color={selectedCardId === card.id ? currentColors.primary : currentColors.textSecondary} 
                        />
                        <View style={styles.savedCardInfo}>
                          <Text style={[styles.savedCardNumber, { color: currentColors.text }]}>
                            •••• •••• •••• {card.cardNumber.slice(-4)}
                          </Text>
                          <Text style={[styles.savedCardExpiry, { color: currentColors.textSecondary }]}>
                            {card.cardholderName} • Expires {card.expiryDate}
                          </Text>
                          {card.isDefault && (
                            <Text style={[styles.savedCardDefault, { color: currentColors.primary }]}>
                              DEFAULT
                            </Text>
                          )}
                        </View>
                        {selectedCardId === card.id && (
                          <IconSymbol name="check-circle" size={24} color={currentColors.primary} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                  
                  <Pressable
                    style={[
                      styles.manageCardsButton,
                      { backgroundColor: currentColors.card }
                    ]}
                    onPress={() => {
                      if (!processing) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/payment-methods');
                      }
                    }}
                    disabled={processing}
                  >
                    <IconSymbol name="credit-card" size={20} color={currentColors.primary} />
                    <Text style={[styles.manageCardsText, { color: currentColors.primary }]}>
                      Manage Payment Methods
                    </Text>
                    <IconSymbol name="chevron-right" size={16} color={currentColors.textSecondary} />
                  </Pressable>

                  <View style={styles.secureLabel}>
                    <IconSymbol name="lock" size={14} color={currentColors.primary} />
                    <Text style={[styles.secureLabelText, { color: currentColors.textSecondary }]}>
                      Secured by Square • Your payment info is encrypted
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.noCardsContainer, { backgroundColor: currentColors.card }]}>
                  <IconSymbol name="credit-card" size={48} color={currentColors.textSecondary} />
                  <Text style={[styles.noCardsText, { color: currentColors.text }]}>
                    No Payment Methods Saved
                  </Text>
                  <Text style={[styles.noCardsSubtext, { color: currentColors.textSecondary }]}>
                    Add a payment method or use web checkout
                  </Text>
                  <Pressable
                    style={[
                      styles.addCardButton,
                      { backgroundColor: currentColors.primary }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/payment-methods');
                    }}
                  >
                    <IconSymbol name="add-circle" size={20} color={currentColors.card} />
                    <Text style={[styles.addCardButtonText, { color: currentColors.card }]}>
                      Add Payment Method
                    </Text>
                  </Pressable>
                </View>
              )
            ) : (
              <View style={[styles.noCardsContainer, { backgroundColor: currentColors.card }]}>
                <IconSymbol name="web" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.noCardsText, { color: currentColors.text }]}>
                  Square Web Checkout
                </Text>
                <Text style={[styles.noCardsSubtext, { color: currentColors.textSecondary }]}>
                  You&apos;ll be redirected to Square&apos;s secure checkout page to complete your payment
                </Text>
                <View style={styles.secureLabel}>
                  <IconSymbol name="lock" size={14} color={currentColors.primary} />
                  <Text style={[styles.secureLabelText, { color: currentColors.textSecondary }]}>
                    PCI-DSS Compliant • Bank-level encryption
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Pressable
              style={[styles.pointsToggle, { backgroundColor: currentColors.card }]}
              onPress={() => {
                if (!processing) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUsePoints(!usePoints);
                }
              }}
              disabled={processing}
            >
              <View style={styles.pointsToggleLeft}>
                <IconSymbol name="star.fill" size={24} color={currentColors.highlight} />
                <View style={styles.pointsToggleInfo}>
                  <Text style={[styles.pointsToggleTitle, { color: currentColors.text }]}>Use Reward Points</Text>
                  <Text style={[styles.pointsToggleSubtitle, { color: currentColors.textSecondary }]}>
                    You have {availablePoints} points available
                  </Text>
                </View>
              </View>
              <View style={[styles.checkbox, { borderColor: currentColors.textSecondary }, usePoints && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }]}>
                {usePoints && <IconSymbol name="check-circle" size={16} color={currentColors.card} />}
              </View>
            </Pressable>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.summaryTitle, { color: currentColors.text }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (8.75%)</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
            </View>
            {usePoints && pointsDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.primary }]}>
                  Points Discount
                </Text>
                <Text style={[styles.summaryValue, { color: currentColors.primary }]}>
                  -${pointsDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal, { borderTopColor: currentColors.background }]}>
              <Text style={[styles.summaryLabelTotal, { color: currentColors.text }]}>Total</Text>
              <Text style={[styles.summaryValueTotal, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
            </View>
            <View style={[styles.pointsEarnCard, { backgroundColor: currentColors.background }]}>
              <IconSymbol name="star.fill" size={20} color={currentColors.highlight} />
              <Text style={[styles.pointsEarnText, { color: currentColors.text }]}>
                You&apos;ll earn {pointsToEarn} points with this order!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: currentColors.card, borderTopColor: currentColors.background }]}>
        <Pressable 
          style={[
            styles.placeOrderButton, 
            { 
              backgroundColor: processing ? currentColors.textSecondary : currentColors.primary,
              opacity: processing ? 0.7 : 1
            }
          ]} 
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <>
              <ActivityIndicator color={currentColors.card} />
              <Text style={[styles.placeOrderButtonText, { color: currentColors.card }]}>
                Processing...
              </Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock" size={20} color={currentColors.card} />
              <Text style={[styles.placeOrderButtonText, { color: currentColors.card }]}>
                Pay ${total.toFixed(2)}
              </Text>
            </>
          )}
        </Pressable>
      </View>
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={currentColors}
      />
    </SafeAreaView>
  );
}
