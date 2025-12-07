
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import { SUPABASE_URL, supabase } from '@/app/integrations/supabase/client';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

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

type OrderType = 'delivery' | 'pickup';

// ============================================================================
// STRIPE PUBLISHABLE KEY
// ============================================================================
// TODO: Replace with your actual Stripe publishable key
// Get this from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SbDvPKZwIF4J9pKEK6dHIGLWdMtwlgkTwzChNtA3BNvVFZY5UkdgpQoas4Tzu9jmYqhKgkVnMAWmtvl0ROvhNwd00kkEUh15y';

// ============================================================================
// CHECKOUT CONTENT COMPONENT
// ============================================================================

function CheckoutContent() {
  const router = useRouter();
  const { 
    cart, 
    userProfile, 
    currentColors, 
    setTabBarVisible,
    clearCart,
    loadUserProfile
  } = useApp();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // ============================================================================
  // STATE
  // ============================================================================

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<string>('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Order state for realtime updates
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [addressValidation]);

  // ============================================================================
  // ORDER CREATION
  // ============================================================================

  const createOrder = useCallback(async () => {
    if (!userProfile) throw new Error('User profile not found');

    console.log('Creating order in Supabase...');

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userProfile.id,
        total: total,
        points_earned: pointsToEarn,
        status: 'pending',
        payment_status: 'pending',
        delivery_address: orderType === 'delivery' ? (validatedAddress || deliveryAddress) : null,
        pickup_notes: orderType === 'pickup' ? pickupNotes : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = cart.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    // Deduct points if used
    if (usePoints && pointsDiscount > 0) {
      const pointsToDeduct = Math.floor(pointsDiscount * 100);
      const { error: pointsError } = await supabase
        .from('user_profiles')
        .update({ points: availablePoints - pointsToDeduct })
        .eq('id', userProfile.id);

      if (pointsError) {
        console.error('Error deducting points:', pointsError);
      }
    }

    return order.id;
  }, [userProfile, total, pointsToEarn, orderType, validatedAddress, deliveryAddress, pickupNotes, cart, usePoints, pointsDiscount, availablePoints]);

  // ============================================================================
  // STRIPE PAYMENT INITIALIZATION
  // ============================================================================

  const initializePaymentSheet = useCallback(async (orderId: string) => {
    try {
      console.log('Initializing Stripe Payment Sheet for order:', orderId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call create-payment-intent edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId,
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            orderType,
            itemCount: cart.length,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating payment intent:', errorText);
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      console.log('Payment intent created:', paymentIntentId);

      // Initialize payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Jagabans LA',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: userProfile?.name,
          email: userProfile?.email,
        },
        allowsDelayedPaymentMethods: false,
        returnURL: 'jagabansla://checkout',
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        throw new Error(error.message);
      }

      console.log('Payment sheet initialized successfully');
      return true;
    } catch (error) {
      console.error('Error in initializePaymentSheet:', error);
      throw error;
    }
  }, [total, orderType, cart, initPaymentSheet, userProfile]);

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  const handlePayment = useCallback(async () => {
    try {
      console.log('Presenting payment sheet...');
      
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          console.log('Payment cancelled by user');
          showToast('info', 'Payment cancelled');
          return false;
        }
        console.error('Payment sheet error:', error);
        throw new Error(error.message);
      }

      console.log('Payment completed successfully');
      return true;
    } catch (error) {
      console.error('Error in handlePayment:', error);
      throw error;
    }
  }, [presentPaymentSheet, showToast]);

  // ============================================================================
  // REALTIME ORDER UPDATES
  // ============================================================================

  useEffect(() => {
    if (!currentOrderId) return;

    console.log('Setting up realtime subscription for order:', currentOrderId);

    const channel = supabase
      .channel(`order-${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          const updatedOrder = payload.new as any;

          if (updatedOrder.payment_status === 'succeeded') {
            console.log('Payment succeeded! Order confirmed.');
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            clearCart();
            loadUserProfile();

            // Navigate to order confirmation screen
            router.replace({
              pathname: '/order-confirmation',
              params: { orderId: currentOrderId },
            });
          } else if (updatedOrder.payment_status === 'failed') {
            console.log('Payment failed');
            showToast('error', 'Payment failed. Please try again.');
            setProcessing(false);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentOrderId, orderType, pointsToEarn, clearCart, loadUserProfile, router, showToast]);

  // ============================================================================
  // ORDER PLACEMENT
  // ============================================================================

  const proceedWithOrder = useCallback(async () => {
    setProcessing(true);

    try {
      // Step 1: Create order in Supabase
      const orderId = await createOrder();
      setCurrentOrderId(orderId);

      // Step 2: Initialize Stripe Payment Sheet
      await initializePaymentSheet(orderId);

      // Step 3: Present payment sheet
      const paymentSuccess = await handlePayment();

      if (!paymentSuccess) {
        setProcessing(false);
        return;
      }

      // Step 4: Wait for webhook to update order status
      // The realtime subscription will handle the success notification
      showToast('info', 'Processing payment...');
      
    } catch (error) {
      console.error('Order placement error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to place order. Please try again.';
      showToast('error', errorMessage);
      setProcessing(false);
      setCurrentOrderId(null);
    }
  }, [createOrder, initializePaymentSheet, handlePayment, showToast]);

  const handlePlaceOrder = useCallback(async () => {
    console.log('Placing order with Stripe...');
    
    // Validate delivery address
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

    await proceedWithOrder();
  }, [orderType, deliveryAddress, addressTouched, addressValidation, showToast, proceedWithOrder]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

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
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: currentColors.textSecondary,
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
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              Secure checkout powered by Stripe. Your payment information is encrypted and protected.
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

          {/* Points Toggle */}
          <View style={styles.section}>
            <Pressable
              style={styles.pointsToggle}
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

// ============================================================================
// MAIN COMPONENT WITH STRIPE PROVIDER
// ============================================================================

export default function CheckoutScreen() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CheckoutContent />
    </StripeProvider>
  );
}
