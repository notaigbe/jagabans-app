
import React, { useState } from 'react';
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
import { SUPABASE_URL } from '@/app/integrations/supabase/client';
import { supabase } from '@/app/integrations/supabase/client';

export default function CheckoutScreen() {
  const router = useRouter();
  const { 
    cart, 
    placeOrder, 
    userProfile, 
    currentColors, 
    setTabBarVisible
  } = useApp();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'web'>('card');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  React.useEffect(() => {
    setTabBarVisible(false);
    return () => {
      setTabBarVisible(true);
    };
  }, []);

  // Set default payment method on load
  React.useEffect(() => {
    if (userProfile?.paymentMethods && userProfile.paymentMethods.length > 0) {
      const defaultCard = userProfile.paymentMethods.find(pm => pm.isDefault);
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      } else {
        setSelectedCardId(userProfile.paymentMethods[0].id);
      }
    }
  }, [userProfile?.paymentMethods]);

  const availablePoints = userProfile?.points || 0;
  const hasSavedCards = userProfile?.paymentMethods && userProfile.paymentMethods.length > 0;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const pointsDiscount = usePoints ? Math.min(availablePoints * 0.01, subtotal * 0.2) : 0;
  const total = subtotal + tax - pointsDiscount;
  const pointsToEarn = Math.floor(total);

  // Process Square payment with saved card
  const processSquarePayment = async () => {
    try {
      const savedCard = userProfile?.paymentMethods.find(pm => pm.id === selectedCardId);
      if (!savedCard) {
        throw new Error('Selected card not found');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // In a real implementation, you would tokenize the card with Square Web Payments SDK
      // For now, we'll use a test source ID for sandbox
      const sourceId = 'cnon:card-nonce-ok'; // Square sandbox test nonce

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-square-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sourceId: sourceId,
            amount: total,
            currency: 'USD',
            note: `Order for ${userProfile?.name || 'Customer'}`,
          }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      return { success: true, payment: result.payment };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error };
    }
  };

  // Create Square web checkout
  const createSquareCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-square-checkout`,
        {
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
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Checkout creation failed');
      }

      return { success: true, checkout: result.checkout };
    } catch (error) {
      console.error('Checkout creation error:', error);
      return { success: false, error };
    }
  };

  const handlePlaceOrder = async () => {
    console.log('Placing order with Square');
    
    if (!deliveryAddress.trim()) {
      showToast('error', 'Please enter a delivery address.');
      return;
    }

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
      let paymentResult;

      if (paymentMethod === 'web') {
        // Create Square web checkout
        paymentResult = await createSquareCheckout();
        
        if (paymentResult.success && paymentResult.checkout) {
          // Open Square checkout URL
          if (Platform.OS === 'web') {
            window.open(paymentResult.checkout.url, '_blank');
          } else {
            // For mobile, you would use WebBrowser or in-app browser
            Alert.alert(
              'Complete Payment',
              'You will be redirected to Square to complete your payment.',
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    // In a real app, open the URL in a WebView or browser
                    console.log('Open checkout URL:', paymentResult.checkout.url);
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
          
          showToast('info', 'Redirecting to Square checkout...');
          return;
        }
      } else {
        // Process payment with saved card
        paymentResult = await processSquarePayment();
      }

      if (!paymentResult.success) {
        showToast('error', 'There was an issue processing your payment. Please try again.');
        return;
      }

      // Place order after successful payment
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await placeOrder(deliveryAddress, pickupNotes || undefined);
      
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully! You earned ${pointsToEarn} points.\n\nPayment ID: ${paymentResult.payment?.id || 'N/A'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/(home)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      showToast('error', 'Failed to place order. Please try again.');
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
    input: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 80,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
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
          <IconSymbol name="chevron.left" size={24} color={currentColors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.infoBanner, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Secure checkout powered by Square. Your payment information is encrypted and protected.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Enter your delivery address"
              placeholderTextColor={currentColors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!processing}
            />
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
                  name="creditcard.fill" 
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
                  name="globe" 
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
                    {userProfile?.paymentMethods.map((card) => (
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
                          name={card.type === 'credit' ? 'creditcard.fill' : 'banknote.fill'} 
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
                          <IconSymbol name="checkmark.circle.fill" size={24} color={currentColors.primary} />
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
                    <IconSymbol name="creditcard" size={20} color={currentColors.primary} />
                    <Text style={[styles.manageCardsText, { color: currentColors.primary }]}>
                      Manage Payment Methods
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color={currentColors.textSecondary} />
                  </Pressable>

                  <View style={styles.secureLabel}>
                    <IconSymbol name="lock.fill" size={14} color={currentColors.primary} />
                    <Text style={[styles.secureLabelText, { color: currentColors.textSecondary }]}>
                      Secured by Square • Your payment info is encrypted
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.noCardsContainer, { backgroundColor: currentColors.card }]}>
                  <IconSymbol name="creditcard" size={48} color={currentColors.textSecondary} />
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
                    <IconSymbol name="plus.circle.fill" size={20} color={currentColors.card} />
                    <Text style={[styles.addCardButtonText, { color: currentColors.card }]}>
                      Add Payment Method
                    </Text>
                  </Pressable>
                </View>
              )
            ) : (
              <View style={[styles.noCardsContainer, { backgroundColor: currentColors.card }]}>
                <IconSymbol name="globe" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.noCardsText, { color: currentColors.text }]}>
                  Square Web Checkout
                </Text>
                <Text style={[styles.noCardsSubtext, { color: currentColors.textSecondary }]}>
                  You&apos;ll be redirected to Square&apos;s secure checkout page to complete your payment
                </Text>
                <View style={styles.secureLabel}>
                  <IconSymbol name="lock.fill" size={14} color={currentColors.primary} />
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
                {usePoints && <IconSymbol name="checkmark" size={16} color={currentColors.card} />}
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
              <IconSymbol name="lock.fill" size={20} color={currentColors.card} />
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
