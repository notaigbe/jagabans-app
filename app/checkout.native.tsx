
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe, CardField, usePaymentSheet } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import Toast from '@/components/Toast';
import Dialog from '@/components/Dialog';

interface StoredCard {
  id: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function CheckoutNativeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, clearCart, currentColors, userProfile, setTabBarVisible, loadUserProfile } = useApp();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [savedCards, setSavedCards] = useState<StoredCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentReady, setPaymentReady] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogButtons, setDialogButtons] = useState<Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>>([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    if (user) {
      loadSavedCards();
      initializePayment();
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log('Toast:', type, message);
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const showDialog = (
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  ) => {
    console.log('Dialog:', title, message);
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogButtons(buttons);
    setDialogVisible(true);
  };

  const loadSavedCards = async () => {
    if (!user) {
      console.log('No user, skipping saved cards load');
      return;
    }

    try {
      console.log('Loading saved cards for user:', user.id);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error loading saved cards:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Loaded saved cards:', data.length);
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          stripePaymentMethodId: card.stripe_payment_method_id,
          cardBrand: card.card_brand,
          last4: card.last4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          isDefault: card.is_default,
        }));
        setSavedCards(cards);
        
        // Auto-select default card
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        }
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
    }
  };

  const initializePayment = async () => {
    if (!user || cart.length === 0) {
      console.log('Cannot initialize payment: no user or empty cart');
      setInitializing(false);
      return;
    }

    try {
      console.log('Initializing payment...');
      setInitializing(true);

      // Create order first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create order in database
      const orderData = {
        user_id: user.id,
        total: total,
        status: 'pending',
        payment_status: 'pending',
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        pickup_notes: deliveryType === 'pickup' ? pickupNotes : null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error('Failed to create order');
      }

      console.log('Order created:', order.id);
      setOrderId(order.id);

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
      }

      // Create payment intent
      const amountInCents = Math.round(total * 100);
      console.log('Creating payment intent for amount:', amountInCents);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: amountInCents,
            currency: 'usd',
            metadata: {
              orderNumber: order.order_number,
              itemCount: cart.length,
            },
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('Payment intent creation failed:', result);
        throw new Error(result.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created:', result.paymentIntentId);

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Jagabans LA',
        paymentIntentClientSecret: result.clientSecret,
        defaultBillingDetails: {
          name: userProfile?.name,
          email: userProfile?.email,
        },
        allowsDelayedPaymentMethods: false,
        returnURL: 'jagabansla://checkout',
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        throw new Error(initError.message);
      }

      console.log('Payment sheet initialized successfully');
      setPaymentReady(true);
      setInitializing(false);
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      setInitializing(false);
      showToast(error.message || 'Failed to initialize payment', 'error');
    }
  };

  const handlePayment = async () => {
    if (!paymentReady || !orderId) {
      console.log('Payment not ready or no order ID');
      showToast('Payment not ready. Please try again.', 'error');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      showToast('Please enter a delivery address', 'error');
      return;
    }

    try {
      console.log('Presenting payment sheet...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);

      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('Payment sheet error:', error);
        if (error.code === 'Canceled') {
          showToast('Payment cancelled', 'info');
        } else {
          showToast(error.message || 'Payment failed', 'error');
        }
        setLoading(false);
        return;
      }

      console.log('Payment successful!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'preparing',
          payment_status: 'completed',
          delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
          pickup_notes: deliveryType === 'pickup' ? pickupNotes : null,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }

      // Add points to user account
      const pointsEarned = Math.floor(total);
      if (userProfile) {
        const { error: pointsError } = await supabase
          .from('user_profiles')
          .update({
            points: (userProfile.points || 0) + pointsEarned,
          })
          .eq('id', user!.id);

        if (pointsError) {
          console.error('Error updating points:', pointsError);
        }
      }

      // Clear cart and reload profile
      clearCart();
      await loadUserProfile();

      setLoading(false);

      // Show success dialog
      showDialog(
        'Order Placed!',
        `Your order has been placed successfully. You earned ${pointsEarned} points!`,
        [
          {
            text: 'View Order',
            onPress: () => {
              router.replace(`/order-confirmation?orderId=${orderId}`);
            },
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setLoading(false);
      showToast(error.message || 'Payment failed', 'error');
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'credit-card';
    if (brandLower.includes('mastercard')) return 'credit-card';
    if (brandLower.includes('amex')) return 'credit-card';
    if (brandLower.includes('discover')) return 'credit-card';
    return 'credit-card';
  };

  if (cart.length === 0) {
    return (
      <LinearGradient
        colors={[
          currentColors.gradientStart || currentColors.background,
          currentColors.gradientMid || currentColors.background,
          currentColors.gradientEnd || currentColors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.backButton}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow-back"
                  size={24}
                  color={currentColors.text}
                />
              </Pressable>
              <Text style={[styles.headerTitle, { color: currentColors.text }]}>Checkout</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="cart.fill"
                android_material_icon_name="shopping-cart"
                size={80}
                color={currentColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: currentColors.text }]}>
                Your cart is empty
              </Text>
              <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
                Add items to your cart before checking out
              </Text>
              <LinearGradient
                colors={[currentColors.secondary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.browseButton}
              >
                <Pressable
                  style={styles.browseButtonInner}
                  onPress={() => router.push('/')}
                >
                  <Text style={[styles.browseButtonText, { color: currentColors.background }]}>
                    Browse Menu
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[
        currentColors.gradientStart || currentColors.background,
        currentColors.gradientMid || currentColors.background,
        currentColors.gradientEnd || currentColors.background,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={currentColors.text}
              />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Checkout</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Delivery Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                Order Type
              </Text>
              <View style={styles.deliveryTypeContainer}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDeliveryType('delivery');
                  }}
                  style={[
                    styles.deliveryTypeButton,
                    {
                      backgroundColor: deliveryType === 'delivery' ? currentColors.secondary : currentColors.card,
                      borderColor: deliveryType === 'delivery' ? currentColors.highlight : currentColors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name="car.fill"
                    android_material_icon_name="local-shipping"
                    size={24}
                    color={deliveryType === 'delivery' ? currentColors.text : currentColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.deliveryTypeText,
                      { color: deliveryType === 'delivery' ? currentColors.text : currentColors.textSecondary },
                    ]}
                  >
                    Delivery
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDeliveryType('pickup');
                  }}
                  style={[
                    styles.deliveryTypeButton,
                    {
                      backgroundColor: deliveryType === 'pickup' ? currentColors.secondary : currentColors.card,
                      borderColor: deliveryType === 'pickup' ? currentColors.highlight : currentColors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name="bag.fill"
                    android_material_icon_name="shopping-bag"
                    size={24}
                    color={deliveryType === 'pickup' ? currentColors.text : currentColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.deliveryTypeText,
                      { color: deliveryType === 'pickup' ? currentColors.text : currentColors.textSecondary },
                    ]}
                  >
                    Pickup
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Delivery Address or Pickup Notes */}
            {deliveryType === 'delivery' ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                  Delivery Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: currentColors.card,
                      color: currentColors.text,
                      borderColor: currentColors.border,
                    },
                  ]}
                  placeholder="Enter your delivery address"
                  placeholderTextColor={currentColors.textSecondary}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                  Pickup Notes (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: currentColors.card,
                      color: currentColors.text,
                      borderColor: currentColors.border,
                    },
                  ]}
                  placeholder="Any special instructions?"
                  placeholderTextColor={currentColors.textSecondary}
                  value={pickupNotes}
                  onChangeText={setPickupNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            {/* Saved Payment Methods */}
            {savedCards.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                  Saved Payment Methods
                </Text>
                {savedCards.map((card) => (
                  <Pressable
                    key={card.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCardId(card.id);
                    }}
                    style={[
                      styles.savedCard,
                      {
                        backgroundColor: selectedCardId === card.id ? currentColors.secondary : currentColors.card,
                        borderColor: selectedCardId === card.id ? currentColors.highlight : currentColors.border,
                      },
                    ]}
                  >
                    <View style={styles.savedCardLeft}>
                      <IconSymbol
                        ios_icon_name="creditcard.fill"
                        android_material_icon_name={getCardBrandIcon(card.cardBrand)}
                        size={24}
                        color={currentColors.text}
                      />
                      <View style={styles.savedCardInfo}>
                        <Text style={[styles.savedCardBrand, { color: currentColors.text }]}>
                          {card.cardBrand}
                        </Text>
                        <Text style={[styles.savedCardNumber, { color: currentColors.textSecondary }]}>
                          •••• {card.last4}
                        </Text>
                      </View>
                    </View>
                    {card.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: currentColors.highlight }]}>
                        <Text style={[styles.defaultBadgeText, { color: currentColors.background }]}>
                          Default
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
                Order Summary
              </Text>
              <LinearGradient
                colors={[
                  currentColors.cardGradientStart || currentColors.card,
                  currentColors.cardGradientEnd || currentColors.card,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.summaryCard, { borderColor: currentColors.border }]}
              >
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.summaryValue, { color: currentColors.text }]}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
                    Tax (9.75%)
                  </Text>
                  <Text style={[styles.summaryValue, { color: currentColors.text }]}>
                    ${tax.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.border }]}>
                  <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: currentColors.secondary }]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.pointsRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={16}
                    color={currentColors.highlight}
                  />
                  <Text style={[styles.pointsText, { color: currentColors.textSecondary }]}>
                    You&apos;ll earn {Math.floor(total)} points with this order
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Payment Button */}
          <View style={[styles.footer, { backgroundColor: currentColors.background }]}>
            {initializing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={currentColors.secondary} />
                <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
                  Preparing payment...
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[currentColors.secondary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButton}
              >
                <Pressable
                  style={styles.payButtonInner}
                  onPress={handlePayment}
                  disabled={loading || !paymentReady}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={currentColors.background} />
                  ) : (
                    <>
                      <Text style={[styles.payButtonText, { color: currentColors.background }]}>
                        Pay ${total.toFixed(2)}
                      </Text>
                      <IconSymbol
                        ios_icon_name="arrow.right"
                        android_material_icon_name="arrow-forward"
                        size={20}
                        color={currentColors.background}
                      />
                    </>
                  )}
                </Pressable>
              </LinearGradient>
            )}
          </View>
        </KeyboardAvoidingView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />

        <Dialog
          visible={dialogVisible}
          title={dialogTitle}
          message={dialogMessage}
          buttons={dialogButtons}
          onHide={() => setDialogVisible(false)}
          currentColors={currentColors}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 12,
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 2,
    gap: 8,
  },
  deliveryTypeText: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
  },
  input: {
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Cormorant_400Regular',
    textAlignVertical: 'top',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 2,
    marginBottom: 12,
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedCardInfo: {
    gap: 4,
  },
  savedCardBrand: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    textTransform: 'capitalize',
  },
  savedCardNumber: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'Cormorant_600SemiBold',
  },
  summaryCard: {
    borderRadius: 0,
    borderWidth: 2,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Cormorant_600SemiBold',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Cormorant_700Bold',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cormorant_400Regular',
  },
  payButton: {
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.5)',
    elevation: 10,
  },
  payButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontFamily: 'Cormorant_700Bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
    elevation: 8,
  },
  browseButtonInner: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
  },
});
