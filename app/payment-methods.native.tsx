
import React, { useState, useEffect, useCallback } from 'react';
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
import Toast from '@/components/Toast';
import Dialog from '@/components/Dialog';
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StoredCard {
  id: string;
  stripePaymentMethodId: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { userProfile, currentColors, loadUserProfile } = useApp();
  const stripe = useStripe();
  
  const [storedCards, setStoredCards] = useState<StoredCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const loadStoredCards = useCallback(async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!stripe) {
        showToast('error', 'Payment system not ready. Try again.');
        return;
      }


      if (data && data.length > 0) {
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          stripePaymentMethodId: card.stripe_payment_method_id || '',
          cardBrand: card.brand || 'card',
          last4: card.last4 || '0000',
          expMonth: card.exp_month || 0,
          expYear: card.exp_year || 0,
          isDefault: card.is_default || false,
        }));
        
        setStoredCards(cards);
      } else {
        setStoredCards([]);
      }
    } catch (error) {
      console.error('Error loading stored cards:', error);
      showToast('error', 'Failed to load saved cards');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      loadStoredCards();
    }
  }, [userProfile, loadStoredCards]);

  const handleAddCard = async () => {
    if (!cardComplete) {
      showToast('error', 'Please enter complete card details');
      return;
    }

    try {
      setProcessing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      if (!stripe) {
        showToast('error', 'Payment system not ready. Try again.');
        return;
      }

      console.log('Creating setup intent...');

      // Create setup intent (this will also create a Stripe customer if needed)
      const setupIntentResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Setup intent response status:', setupIntentResponse.status);
      
      // Get the response text first
      const responseText = await setupIntentResponse.text();
      console.log('Setup intent response text:', responseText);

      if (!setupIntentResponse.ok) {
        let errorMessage = 'Failed to create setup intent';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let setupIntentData;
      try {
        setupIntentData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse setup intent response:', e);
        throw new Error('Invalid response from server');
      }

      const { clientSecret, customerId } = setupIntentData;
      console.log('Setup intent created with customer:', customerId);

      // Confirm setup intent with card details
      console.log('Confirming setup intent...');
      const { setupIntent, error: confirmError } = await stripe.confirmSetupIntent(
        clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (confirmError) {
        console.error('Confirm setup intent error:', confirmError);
        throw new Error(confirmError.message);
      }

      console.log('Setup intent status:', setupIntent?.status);

      if (
          !setupIntent ||
          !['Succeeded', 'RequiresAction', 'Processing'].includes(setupIntent.status)
        ) {
          throw new Error('Failed to save card');
        }

      console.log('Saving payment method to database...');

      // Save payment method
      const saveResponse = await fetch(`${SUPABASE_URL}/functions/v1/save-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethodId: setupIntent.paymentMethod?.id,
          setAsDefault: storedCards.length === 0,
        }),
      });

      console.log('Save payment method response status:', saveResponse.status);

      // Get the response text first
      const saveResponseText = await saveResponse.text();
      console.log('Save payment method response text:', saveResponseText);

      if (!saveResponse.ok) {
        let errorMessage = 'Failed to save payment method';
        try {
          const errorData = JSON.parse(saveResponseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse save error response:', e);
          errorMessage = saveResponseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showToast('success', 'Card added successfully');
      setShowAddCard(false);
      await loadStoredCards();
    } catch (error: any) {
      console.error('Error adding card:', error);
      showToast('error', error.message || 'Failed to add card');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      setProcessing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/update-default-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to update default payment method';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showToast('success', 'Default card updated successfully');
      await loadStoredCards();
    } catch (error: any) {
      console.error('Error setting default card:', error);
      showToast('error', error.message || 'Failed to update default card');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCard = (paymentMethodId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);

              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error('Not authenticated');

              const response = await fetch(`${SUPABASE_URL}/functions/v1/detach-payment-method`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ paymentMethodId }),
              });

              const responseText = await response.text();

              if (!response.ok) {
                let errorMessage = 'Failed to remove payment method';
                try {
                  const errorData = JSON.parse(responseText);
                  errorMessage = errorData.error || errorMessage;
                } catch (e) {
                  errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
              }

              showToast('success', 'Payment method removed successfully');
              await loadStoredCards();
            } catch (error: any) {
              console.error('Error removing card:', error);
              showToast('error', error.message || 'Failed to remove payment method');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'creditcard.fill';
    if (brandLower.includes('mastercard')) return 'creditcard.fill';
    if (brandLower.includes('amex') || brandLower.includes('american')) return 'creditcard.fill';
    if (brandLower.includes('discover')) return 'creditcard.fill';
    return 'creditcard';
  };

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
              style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Payment Methods</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.infoCard, { borderColor: currentColors.border }]}
            >
              <IconSymbol name="info.circle.fill" size={20} color={currentColors.secondary} />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Securely save your payment methods for faster checkout. Your card information is encrypted and stored by Stripe.
              </Text>
            </LinearGradient>

            {showAddCard && (
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.addCardForm, { borderColor: currentColors.border }]}
              >
                <Text style={[styles.addCardTitle, { color: currentColors.text }]}>Add New Card</Text>
                <CardField
                  postalCodeEnabled={false}
                  placeholders={{
                    number: '4242 4242 4242 4242',
                  }}
                  cardStyle={{
                    backgroundColor: currentColors.background,
                    textColor: currentColors.text,
                  }}
                  style={styles.cardField}
                  onCardChange={(cardDetails) => {
                    setCardComplete(cardDetails.complete);
                  }}
                />
                <View style={styles.addCardButtons}>
                  <Pressable
                    style={[styles.cancelButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
                    onPress={() => setShowAddCard(false)}
                    disabled={processing}
                  >
                    <Text style={[styles.cancelButtonText, { color: currentColors.text }]}>Cancel</Text>
                  </Pressable>
                  <LinearGradient
                    colors={[currentColors.secondary, currentColors.highlight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.saveButton, { opacity: processing || !cardComplete ? 0.5 : 1 }]}
                  >
                    <Pressable
                      style={styles.saveButtonInner}
                      onPress={handleAddCard}
                      disabled={processing || !cardComplete}
                    >
                      {processing ? (
                        <ActivityIndicator color={currentColors.background} />
                      ) : (
                        <Text style={[styles.saveButtonText, { color: currentColors.background }]}>Save Card</Text>
                      )}
                    </Pressable>
                  </LinearGradient>
                </View>
              </LinearGradient>
            )}

            {!showAddCard && (
              <LinearGradient
                colors={[currentColors.secondary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addNewButton}
              >
                <Pressable
                  style={styles.addNewButtonInner}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAddCard(true);
                  }}
                  disabled={processing}
                >
                  <IconSymbol name="add" size={24} color={currentColors.background} />
                  <Text style={[styles.addNewButtonText, { color: currentColors.background }]}>
                    Add New Card
                  </Text>
                </Pressable>
              </LinearGradient>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.secondary} />
                <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
                  Loading saved cards...
                </Text>
              </View>
            ) : storedCards.length === 0 && !showAddCard ? (
              <View style={styles.emptyState}>
                <IconSymbol name="creditcard" size={80} color={currentColors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Payment Methods</Text>
                <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                  Add a payment method to make checkout faster and easier.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {storedCards.map((card) => (
                  <LinearGradient
                    key={card.id}
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.cardItem, { borderColor: currentColors.border }]}
                  >
                    <View style={styles.cardInfo}>
                      <View style={[styles.iconContainer, { borderColor: currentColors.border }]}>
                        <IconSymbol name={getCardBrandIcon(card.cardBrand)} size={32} color={currentColors.secondary} />
                      </View>
                      <View style={styles.cardDetails}>
                        <Text style={[styles.cardNumber, { color: currentColors.text }]}>
                          {card.cardBrand.toUpperCase()} •••• {card.last4}
                        </Text>
                        <Text style={[styles.cardExpiry, { color: currentColors.textSecondary }]}>
                          Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      {card.isDefault ? (
                        <LinearGradient
                          colors={[currentColors.secondary, currentColors.highlight]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.defaultBadge}
                        >
                          <Text style={[styles.defaultBadgeText, { color: currentColors.background }]}>Default</Text>
                        </LinearGradient>
                      ) : (
                        <Pressable
                          onPress={() => handleSetDefault(card.stripePaymentMethodId)}
                          style={styles.setDefaultButton}
                          disabled={processing}
                        >
                          <Text style={[styles.setDefaultText, { color: currentColors.secondary }]}>
                            Set as Default
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleRemoveCard(card.stripePaymentMethodId)}
                        style={styles.removeButton}
                        disabled={processing}
                      >
                        <IconSymbol name="trash" size={20} color={currentColors.textSecondary} />
                      </Pressable>
                    </View>
                  </LinearGradient>
                ))}
              </View>
            )}

            <View style={styles.securityNote}>
              <IconSymbol name="lock.fill" size={20} color={currentColors.textSecondary} />
              <Text style={[styles.securityNoteText, { color: currentColors.textSecondary }]}>
                Your payment information is encrypted and secure
              </Text>
            </View>
          </ScrollView>
        </View>
        
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={currentColors}
        />
        <Dialog
          visible={dialogVisible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 2,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  cardItem: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    padding: 8,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 0,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 16,
  },
  cardNumber: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  setDefaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  setDefaultText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  removeButton: {
    padding: 8,
  },
  addNewButton: {
    borderRadius: 0,
    marginBottom: 20,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
    elevation: 8,
  },
  addNewButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  addCardForm: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  addCardTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 16,
  },
  cardField: {
    height: 50,
    marginBottom: 16,
  },
  addCardButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  saveButton: {
    flex: 1,
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
    elevation: 8,
  },
  saveButtonInner: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 0,
    gap: 12,
    marginBottom: 20,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  securityNoteText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
