
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

// Conditionally import Square SDK only on native platforms
let SQIPCardEntry: any = null;
let SQIPCore: any = null;

if (Platform.OS !== 'web') {
  try {
    // Using dynamic import instead of require
    import('react-native-square-in-app-payments').then((SquareSDK) => {
      SQIPCardEntry = SquareSDK.SQIPCardEntry;
      SQIPCore = SquareSDK.SQIPCore;
    }).catch((error) => {
      console.warn('Square SDK not available:', error);
    });
  } catch (error) {
    console.warn('Square SDK not available:', error);
  }
}

// ============================================================================
// TYPES
// ============================================================================

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
  orderId?: string;
  orderNumber?: number;
  paymentId?: string;
  pointsEarned?: number;
  error?: any;
}

interface StoredCard {
  id: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName?: string;
  isDefault: boolean;
  squareCardId: string;
  squareCustomerId: string;
}

type OrderType = 'delivery' | 'pickup';
type PaymentMethodType = 'new-card' | 'stored-card';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  // ============================================================================
  // STATE
  // ============================================================================

  // Order state
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('stored-card');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [storedCards, setStoredCards] = useState<StoredCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardNonce, setCardNonce] = useState<string>('');
  const [saveCard, setSaveCard] = useState(true);
  const [squareAvailable, setSquareAvailable] = useState(false);
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const availablePoints = userProfile?.points || 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(availablePoints * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const parseAddress = useCallback((address: string) => {
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
  }, [addressValidation]);

  const getAddressValidationColor = useCallback(() => {
    if (!addressValidation) return currentColors.textSecondary;
    if (!addressValidation.isValid) return '#EF4444';
    if (addressValidation.confidence === 'high') return '#10B981';
    if (addressValidation.confidence === 'medium') return '#F59E0B';
    return '#EF4444';
  }, [addressValidation, currentColors.textSecondary]);

  const getAddressValidationIcon = useCallback(() => {
    if (isValidatingAddress) return 'hourglass';
    if (!addressValidation) return 'location-pin';
    if (!addressValidation.isValid) return 'xmark.circle.fill';
    if (addressValidation.confidence === 'high') return 'checkmark.circle.fill';
    if (addressValidation.confidence === 'medium') return 'exclamationmark.triangle.fill';
    return 'xmark.circle.fill';
  }, [isValidatingAddress, addressValidation]);

  const getAddressValidationMessage = useCallback(() => {
    if (isValidatingAddress) return 'Validating address...';
    if (!addressValidation) return '';
    if (!addressValidation.isValid) return 'Address could not be verified. Please check for errors.';
    if (addressValidation.confidence === 'high') return 'Address verified ✓';
    if (addressValidation.confidence === 'medium') return 'Address partially verified. Please review.';
    return 'Address verification failed.';
  }, [isValidatingAddress, addressValidation]);

  const getCardBrandIcon = useCallback((brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'creditcard.fill';
    if (brandLower.includes('mastercard')) return 'creditcard.fill';
    if (brandLower.includes('amex') || brandLower.includes('american')) return 'creditcard.fill';
    if (brandLower.includes('discover')) return 'creditcard.fill';
    return 'creditcard';
  }, []);

  // ============================================================================
  // SQUARE SDK INITIALIZATION
  // ============================================================================

  const initializeSquare = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('Square In-App Payments SDK is not available on web');
      setSquareAvailable(false);
      return;
    }

    if (!SQIPCore || !SQIPCardEntry) {
      console.error('Square SDK not loaded');
      setSquareAvailable(false);
      return;
    }

    try {
      const applicationId = 'CONFIGURE_YOUR_SQUARE_APP_ID';
      
      if (!applicationId || applicationId === 'CONFIGURE_YOUR_SQUARE_APP_ID') {
        console.warn('⚠️ Square Application ID not configured!');
        console.warn('To enable card entry:');
        console.warn('1. Go to https://developer.squareup.com/apps');
        console.warn('2. Create or select your application');
        console.warn('3. Copy your Application ID from the Credentials page');
        console.warn('4. Update the applicationId in app/checkout.tsx');
        setSquareAvailable(false);
        return;
      }
      
      if (!applicationId.startsWith('sandbox-sq0idb-') && !applicationId.startsWith('sq0idp-')) {
        console.error('Invalid Square Application ID format');
        setSquareAvailable(false);
        return;
      }
      
      await SQIPCore.setSquareApplicationId(applicationId);
      console.log('Square SDK initialized successfully');
      setSquareAvailable(true);
    } catch (error) {
      console.error('Failed to initialize Square SDK:', error);
      setSquareAvailable(false);
    }
  }, []);

  // ============================================================================
  // STORED CARDS
  // ============================================================================

  const loadStoredCards = useCallback(async () => {
    if (!userProfile) return;
    
    setLoadingCards(true);
    try {
      console.log('Loading stored cards for user:', userProfile.id);
      
      const { data, error } = await supabase
        .from('square_cards')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading stored cards:', error);
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('square_cards')) {
          console.warn('⚠️ square_cards table does not exist in the database.');
          setStoredCards([]);
          setLoadingCards(false);
          return;
        }
        throw error;
      }

      console.log('Loaded cards data:', data);

      if (data && data.length > 0) {
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          cardBrand: card.card_brand,
          last4: card.last_4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          cardholderName: card.cardholder_name,
          isDefault: card.is_default,
          squareCardId: card.square_card_id,
          squareCustomerId: card.square_customer_id,
        }));
        
        console.log('Processed cards:', cards);
        setStoredCards(cards);
        
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
          setPaymentMethod('stored-card');
          console.log('Auto-selected default card:', defaultCard.id);
        }
      } else {
        console.log('No stored cards found');
        setStoredCards([]);
        setPaymentMethod('new-card');
      }
    } catch (error) {
      console.error('Error loading stored cards:', error);
      setStoredCards([]);
      setPaymentMethod('new-card');
    } finally {
      setLoadingCards(false);
    }
  }, [userProfile]);

  // ============================================================================
  // ADDRESS VALIDATION
  // ============================================================================

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

  const useFormattedAddress = useCallback(() => {
    if (addressValidation?.formattedAddress) {
      setDeliveryAddress(addressValidation.formattedAddress);
      setValidatedAddress(addressValidation.formattedAddress);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [addressValidation]);

  // ============================================================================
  // CARD ENTRY
  // ============================================================================

  const handleCardEntry = useCallback(async () => {
    if (!squareAvailable || !SQIPCardEntry) {
      Alert.alert(
        'Card Entry Not Available',
        'The card entry feature is not available on this platform. Please use a saved card or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setProcessing(true);
      
      await SQIPCardEntry.startCardEntryFlow(
        {
          collectPostalCode: true,
          skipCardHolderName: false,
        },
        async (cardDetails: any) => {
          console.log('Card nonce received:', cardDetails.nonce);
          setCardNonce(cardDetails.nonce);
          showToast('success', 'Card information captured successfully');
          setProcessing(false);
        },
        (error: any) => {
          console.error('Card entry error:', error);
          showToast('error', error.message || 'Failed to capture card information');
          setProcessing(false);
        },
        () => {
          console.log('Card entry cancelled');
          setProcessing(false);
        }
      );
    } catch (error) {
      console.error('Failed to start card entry:', error);
      showToast('error', 'Failed to open card entry form');
      setProcessing(false);
    }
  }, [squareAvailable, showToast]);

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  const processSquarePayment = useCallback(async (): Promise<PaymentResult> => {
    try {
      console.log('Starting Square payment process...');
      
      if (!userProfile) throw new Error('User profile not found');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in and try again.');
      }

      console.log('Session obtained, calling process-square-payment Edge Function...');

      const addressParts = orderType === 'delivery' 
        ? parseAddress(validatedAddress || deliveryAddress)
        : { address: '', city: '', state: '', zip: '' };
      
      let sourceId: string;
      let shouldSaveCard = false;
      let customerId: string | undefined;
      
      if (paymentMethod === 'stored-card' && selectedCardId) {
        const selectedCard = storedCards.find(c => c.id === selectedCardId);
        if (!selectedCard) throw new Error('Selected card not found');
        
        sourceId = selectedCard.squareCardId;
        customerId = selectedCard.squareCustomerId;
        console.log('Using stored card:', { sourceId, customerId });
      } else if (paymentMethod === 'new-card' && cardNonce) {
        sourceId = cardNonce;
        shouldSaveCard = saveCard;
        console.log('Using new card nonce:', sourceId);
      } else {
        throw new Error('Please select a payment method or add a new card');
      }

      const amountInCents = Math.round(total * 100);

      const requestBody = {
        sourceId,
        amount: amountInCents,
        currency: 'USD',
        saveCard: shouldSaveCard,
        customerId,
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
        orderType,
        deliveryAddress: orderType === 'delivery' ? (validatedAddress || deliveryAddress) : undefined,
        pickupNotes: orderType === 'pickup' ? pickupNotes : undefined,
      };

      console.log('Payment request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-square-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
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

      if (shouldSaveCard) {
        await loadStoredCards();
      }

      return { 
        success: true, 
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        paymentId: result.paymentId,
        pointsEarned: result.pointsEarned,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error };
    }
  }, [userProfile, orderType, parseAddress, validatedAddress, deliveryAddress, paymentMethod, selectedCardId, storedCards, cardNonce, saveCard, total, cart, pickupNotes, loadStoredCards]);

  // ============================================================================
  // ORDER HANDLING
  // ============================================================================

  const proceedWithOrder = useCallback(async () => {
    setProcessing(true);

    try {
      const paymentResult = await processSquarePayment();

      if (!paymentResult.success) {
        const errorMessage = paymentResult.error instanceof Error 
          ? paymentResult.error.message 
          : 'There was an issue processing your payment. Please try again.';
        showToast('error', errorMessage);
        setProcessing(false);
        return;
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      clearCart();
      await loadUserProfile();
      
      const orderTypeText = orderType === 'delivery' ? 'delivery' : 'pickup';
      Alert.alert(
        'Order Placed!',
        `Your ${orderTypeText} order has been placed successfully!\n\nOrder #${paymentResult.orderNumber || 'N/A'}\nPayment ID: ${paymentResult.paymentId || 'N/A'}\n\nYou earned ${paymentResult.pointsEarned || 0} points!`,
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
  }, [processSquarePayment, showToast, clearCart, loadUserProfile, orderType, router]);

  const handlePlaceOrder = useCallback(async () => {
    console.log('Placing order with Square Payments API');
    
    if (orderType === 'delivery') {
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
    }

    if (paymentMethod === 'stored-card' && !selectedCardId) {
      showToast('error', 'Please select a payment method.');
      return;
    }

    if (paymentMethod === 'new-card' && !cardNonce) {
      showToast('error', 'Please add your card information.');
      return;
    }

    await proceedWithOrder();
  }, [orderType, deliveryAddress, addressTouched, addressValidation, paymentMethod, selectedCardId, cardNonce, showToast, proceedWithOrder]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (userProfile) {
      loadStoredCards();
      initializeSquare();
    }
  }, [userProfile, loadStoredCards, initializeSquare]);

  useEffect(() => {
    if (orderType !== 'delivery' || !addressTouched || !deliveryAddress.trim()) {
      return;
    }
    const timeoutId = setTimeout(() => validateAddress(deliveryAddress), 1000);
    return () => clearTimeout(timeoutId);
  }, [deliveryAddress, addressTouched, orderType, validateAddress]);

  // ============================================================================
  // STYLES
  // ============================================================================

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
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
      backgroundColor: currentColors.highlight + '20',
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: currentColors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: currentColors.text,
    },
    orderTypeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    orderTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 8,
    },
    orderTypeText: {
      fontSize: 16,
      fontWeight: '600',
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
      backgroundColor: currentColors.card,
      color: currentColors.text,
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
      backgroundColor: currentColors.card,
      borderColor: currentColors.primary + '40',
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
      color: currentColors.text,
    },
    suggestionAddress: {
      fontSize: 14,
      marginBottom: 8,
      lineHeight: 20,
      color: currentColors.textSecondary,
    },
    useSuggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: 6,
      gap: 6,
      backgroundColor: currentColors.primary,
    },
    useSuggestionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: currentColors.card,
    },
    paymentMethodSelector: {
      gap: 12,
    },
    paymentMethodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    paymentMethodInfo: {
      flex: 1,
    },
    paymentMethodTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    paymentMethodSubtitle: {
      fontSize: 14,
      marginTop: 2,
      color: currentColors.textSecondary,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: currentColors.primary,
    },
    storedCardsList: {
      gap: 12,
      marginTop: 12,
    },
    storedCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      gap: 12,
    },
    storedCardInfo: {
      flex: 1,
    },
    storedCardBrand: {
      fontSize: 16,
      fontWeight: '600',
    },
    storedCardDetails: {
      fontSize: 14,
      marginTop: 2,
      color: currentColors.textSecondary,
    },
    defaultBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
      alignSelf: 'flex-start',
      backgroundColor: currentColors.primary,
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: currentColors.card,
    },
    addCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      gap: 8,
      marginTop: 12,
      backgroundColor: currentColors.card,
      borderColor: currentColors.primary,
    },
    addCardButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.primary,
    },
    saveCardToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 12,
      backgroundColor: currentColors.card,
    },
    saveCardText: {
      flex: 1,
      fontSize: 14,
      color: currentColors.text,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: currentColors.textSecondary,
    },
    pointsToggle: {
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
      backgroundColor: currentColors.card,
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
      color: currentColors.text,
    },
    pointsToggleSubtitle: {
      fontSize: 14,
      marginTop: 2,
      color: currentColors.textSecondary,
    },
    summaryCard: {
      borderRadius: 12,
      padding: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
      backgroundColor: currentColors.card,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: currentColors.text,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      color: currentColors.text,
    },
    summaryRowTotal: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 4,
      borderTopColor: currentColors.background,
    },
    summaryLabelTotal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    summaryValueTotal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.primary,
    },
    pointsEarnCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
      backgroundColor: currentColors.background,
    },
    pointsEarnText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: currentColors.text,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      backgroundColor: currentColors.card,
      borderTopColor: currentColors.background,
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
      color: currentColors.card,
    },
    warningBanner: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
      backgroundColor: '#FEF3C7',
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: '#92400E',
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <IconSymbol name="info" size={20} color={currentColors.primary} />
            <Text style={styles.infoText}>
              Secure checkout powered by Square. Your payment information is encrypted and protected.
            </Text>
          </View>

          {/* Order Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Type</Text>
            <View style={styles.orderTypeSelector}>
              <Pressable
                style={[
                  styles.orderTypeButton,
                  {
                    backgroundColor: orderType === 'delivery' ? currentColors.primary : currentColors.card,
                    borderColor: orderType === 'delivery' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setOrderType('delivery');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="delivery-dining" 
                  size={20} 
                  color={orderType === 'delivery' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.orderTypeText, 
                  { color: orderType === 'delivery' ? currentColors.card : currentColors.text }
                ]}>
                  Delivery
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderTypeButton,
                  {
                    backgroundColor: orderType === 'pickup' ? currentColors.primary : currentColors.card,
                    borderColor: orderType === 'pickup' ? currentColors.primary : currentColors.border,
                  }
                ]}
                onPress={() => {
                  if (!processing) {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setOrderType('pickup');
                  }
                }}
                disabled={processing}
              >
                <IconSymbol 
                  name="shopping-bag" 
                  size={20} 
                  color={orderType === 'pickup' ? currentColors.card : currentColors.text} 
                />
                <Text style={[
                  styles.orderTypeText, 
                  { color: orderType === 'pickup' ? currentColors.card : currentColors.text }
                ]}>
                  Pickup
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Delivery Address (conditional) */}
          {orderType === 'delivery' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithValidation,
                    { 
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
                <View style={styles.formattedAddressSuggestion}>
                  <View style={styles.suggestionHeader}>
                    <IconSymbol name="lightbulb.fill" size={16} color={currentColors.primary} />
                    <Text style={styles.suggestionTitle}>
                      Suggested Address
                    </Text>
                  </View>
                  <Text style={styles.suggestionAddress}>
                    {addressValidation.formattedAddress}
                  </Text>
                  <Pressable
                    style={styles.useSuggestionButton}
                    onPress={useFormattedAddress}
                  >
                    <IconSymbol name="checkmark" size={14} color={currentColors.card} />
                    <Text style={styles.useSuggestionButtonText}>
                      Use This Address
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {orderType === 'pickup' ? 'Pickup Notes (Optional)' : 'Delivery Notes (Optional)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={orderType === 'pickup' 
                ? 'Add any special instructions for pickup...' 
                : 'Add any special instructions for delivery...'}
              placeholderTextColor={currentColors.textSecondary}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!processing}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method *</Text>
            
            {loadingCards ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <Text style={[{ color: currentColors.textSecondary, marginTop: 12 }]}>
                  Loading saved cards...
                </Text>
              </View>
            ) : (
              <View style={styles.paymentMethodSelector}>
                {storedCards.length > 0 && (
                  <>
                    <Pressable
                      style={[
                        styles.paymentMethodButton,
                        {
                          backgroundColor: paymentMethod === 'stored-card' ? currentColors.primary + '20' : currentColors.card,
                          borderColor: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.border,
                        }
                      ]}
                      onPress={() => {
                        if (!processing) {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setPaymentMethod('stored-card');
                        }
                      }}
                      disabled={processing}
                    >
                      <IconSymbol 
                        name="creditcard.fill" 
                        size={24} 
                        color={paymentMethod === 'stored-card' ? currentColors.primary : currentColors.text} 
                      />
                      <View style={styles.paymentMethodInfo}>
                        <Text style={[
                          styles.paymentMethodTitle, 
                          { color: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.text }
                        ]}>
                          Saved Card
                        </Text>
                        <Text style={styles.paymentMethodSubtitle}>
                          Use a saved payment method
                        </Text>
                      </View>
                      <View style={[
                        styles.radioButton,
                        { borderColor: paymentMethod === 'stored-card' ? currentColors.primary : currentColors.textSecondary }
                      ]}>
                        {paymentMethod === 'stored-card' && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </Pressable>

                    {paymentMethod === 'stored-card' && (
                      <View style={styles.storedCardsList}>
                        {storedCards.map((card) => (
                          <Pressable
                            key={card.id}
                            style={[
                              styles.storedCardItem,
                              {
                                backgroundColor: selectedCardId === card.id ? currentColors.primary + '10' : currentColors.card,
                                borderColor: selectedCardId === card.id ? currentColors.primary : currentColors.border,
                              }
                            ]}
                            onPress={() => {
                              if (!processing) {
                                if (Platform.OS !== 'web') {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                setSelectedCardId(card.id);
                              }
                            }}
                            disabled={processing}
                          >
                            <IconSymbol 
                              name={getCardBrandIcon(card.cardBrand)} 
                              size={32} 
                              color={selectedCardId === card.id ? currentColors.primary : currentColors.text} 
                            />
                            <View style={styles.storedCardInfo}>
                              <Text style={[
                                styles.storedCardBrand, 
                                { color: selectedCardId === card.id ? currentColors.primary : currentColors.text }
                              ]}>
                                {card.cardBrand} •••• {card.last4}
                              </Text>
                              <Text style={styles.storedCardDetails}>
                                Expires {card.expMonth}/{card.expYear}
                              </Text>
                              {card.isDefault && (
                                <View style={styles.defaultBadge}>
                                  <Text style={styles.defaultBadgeText}>
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={[
                              styles.radioButton,
                              { borderColor: selectedCardId === card.id ? currentColors.primary : currentColors.textSecondary }
                            ]}>
                              {selectedCardId === card.id && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {squareAvailable && (
                  <Pressable
                    style={[
                      styles.paymentMethodButton,
                      {
                        backgroundColor: paymentMethod === 'new-card' ? currentColors.primary + '20' : currentColors.card,
                        borderColor: paymentMethod === 'new-card' ? currentColors.primary : currentColors.border,
                      }
                    ]}
                    onPress={() => {
                      if (!processing) {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setPaymentMethod('new-card');
                      }
                    }}
                    disabled={processing}
                  >
                    <IconSymbol 
                      name="plus.circle.fill" 
                      size={24} 
                      color={paymentMethod === 'new-card' ? currentColors.primary : currentColors.text} 
                    />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={[
                        styles.paymentMethodTitle, 
                        { color: paymentMethod === 'new-card' ? currentColors.primary : currentColors.text }
                      ]}>
                        New Card
                      </Text>
                      <Text style={styles.paymentMethodSubtitle}>
                        {cardNonce ? 'Card added ✓' : 'Add a new payment method'}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioButton,
                      { borderColor: paymentMethod === 'new-card' ? currentColors.primary : currentColors.textSecondary }
                    ]}>
                      {paymentMethod === 'new-card' && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </Pressable>
                )}

                {paymentMethod === 'new-card' && !cardNonce && squareAvailable && (
                  <>
                    <Pressable
                      style={styles.addCardButton}
                      onPress={handleCardEntry}
                      disabled={processing}
                    >
                      <IconSymbol name="creditcard" size={20} color={currentColors.primary} />
                      <Text style={styles.addCardButtonText}>
                        Enter Card Details
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.saveCardToggle}
                      onPress={() => {
                        if (!processing) {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSaveCard(!saveCard);
                        }
                      }}
                      disabled={processing}
                    >
                      <IconSymbol name="lock.fill" size={20} color={currentColors.textSecondary} />
                      <Text style={styles.saveCardText}>
                        Save card for future purchases
                      </Text>
                      <View style={[
                        styles.checkbox, 
                        saveCard && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }
                      ]}>
                        {saveCard && <IconSymbol name="check-circle" size={16} color={currentColors.card} />}
                      </View>
                    </Pressable>
                  </>
                )}

                {!squareAvailable && storedCards.length === 0 && (
                  <View style={styles.warningBanner}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#92400E" />
                    <Text style={styles.warningText}>
                      Card entry is not available on this platform. Please contact support to add a payment method.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Points Toggle */}
          <View style={styles.section}>
            <Pressable
              style={styles.pointsToggle}
              onPress={() => {
                if (!processing) {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setUsePoints(!usePoints);
                }
              }}
              disabled={processing}
            >
              <View style={styles.pointsToggleLeft}>
                <IconSymbol name="star.fill" size={24} color={currentColors.highlight} />
                <View style={styles.pointsToggleInfo}>
                  <Text style={styles.pointsToggleTitle}>Use Reward Points</Text>
                  <Text style={styles.pointsToggleSubtitle}>
                    You have {availablePoints} points available
                  </Text>
                </View>
              </View>
              <View style={[
                styles.checkbox, 
                usePoints && { backgroundColor: currentColors.primary, borderColor: currentColors.primary }
              ]}>
                {usePoints && <IconSymbol name="check-circle" size={16} color={currentColors.card} />}
              </View>
            </Pressable>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8.75%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
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
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.pointsEarnCard}>
              <IconSymbol name="star.fill" size={20} color={currentColors.highlight} />
              <Text style={styles.pointsEarnText}>
                You&apos;ll earn {pointsToEarn} points with this order!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer with Place Order Button */}
      <View style={styles.footer}>
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
              <Text style={styles.placeOrderButtonText}>
                Processing...
              </Text>
            </>
          ) : (
            <>
              <IconSymbol name="lock" size={20} color={currentColors.card} />
              <Text style={styles.placeOrderButtonText}>
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
