
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import { useStripe, CardField } from '@stripe/stripe-react-native';

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
  const { confirmSetupIntent } = useStripe();
  
  const [storedCards, setStoredCards] = useState<StoredCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const loadStoredCards = useCallback(async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stripe_payment_methods')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          stripePaymentMethodId: card.stripe_payment_method_id,
          cardBrand: card.card_brand || 'card',
          last4: card.card_last4 || '****',
          expMonth: card.card_exp_month || 0,
          expYear: card.card_exp_year || 0,
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

      // First, ensure user has a Stripe customer
      const customerResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-stripe-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create customer');
      }

      const { customerId } = await customerResponse.json();

      // Create setup intent
      const setupIntentResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ customerId }),
      });

      if (!setupIntentResponse.ok) {
        throw new Error('Failed to create setup intent');
      }

      const { clientSecret } = await setupIntentResponse.json();

      // Confirm setup intent with card details
      const { setupIntent, error: confirmError } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent?.status !== 'Succeeded') {
        throw new Error('Failed to save card');
      }

      // Save payment method
      const saveResponse = await fetch(`${SUPABASE_URL}/functions/v1/save-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethodId: setupIntent.paymentMethodId,
          setAsDefault: storedCards.length === 0,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save payment method');
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

      if (!response.ok) {
        throw new Error('Failed to update default payment method');
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

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
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

              if (!response.ok) {
                throw new Error('Failed to remove payment method');
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

  const styles = StyleSheet.create({
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
      paddingVertical: 16,
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
      fontSize: 20,
      fontWeight: 'bold',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
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
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 24,
    },
    cardsContainer: {
      marginBottom: 20,
    },
    cardItem: {
      borderRadius: 0,
      padding: 20,
      marginBottom: 16,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    cardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardDetails: {
      flex: 1,
      marginLeft: 16,
    },
    cardNumber: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 4,
    },
    cardExpiry: {
      fontSize: 12,
    },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    defaultBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    defaultBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    setDefaultButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    setDefaultText: {
      fontSize: 14,
      fontWeight: '600',
    },
    removeButton: {
      padding: 8,
    },
    addNewButton: {
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    addNewButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 12,
    },
    addCardForm: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    addCardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
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
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: currentColors.background,
      borderWidth: 1,
      borderColor: currentColors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.text,
    },
    saveButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: currentColors.primary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentColors.card,
    },
    infoCard: {
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
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 8,
    },
    securityNoteText: {
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
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
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Securely save your payment methods for faster checkout. Your card information is encrypted and stored by Stripe.
            </Text>
          </View>

          {showAddCard && (
            <View style={styles.addCardForm}>
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
                  style={styles.cancelButton}
                  onPress={() => setShowAddCard(false)}
                  disabled={processing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, { opacity: processing || !cardComplete ? 0.5 : 1 }]}
                  onPress={handleAddCard}
                  disabled={processing || !cardComplete}
                >
                  {processing ? (
                    <ActivityIndicator color={currentColors.card} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Card</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {!showAddCard && (
            <Pressable
              style={[styles.addNewButton, { backgroundColor: currentColors.primary }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowAddCard(true);
              }}
              disabled={processing}
            >
              <IconSymbol name="add" size={24} color={currentColors.card} />
              <Text style={[styles.addNewButtonText, { color: currentColors.card }]}>
                Add New Card
              </Text>
            </Pressable>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentColors.primary} />
              <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
                Loading saved cards...
              </Text>
            </View>
          ) : storedCards.length === 0 && !showAddCard ? (
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard" size={64} color={currentColors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Payment Methods</Text>
              <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                Add a payment method to make checkout faster and easier.
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {storedCards.map((card) => (
                <View key={card.id} style={[styles.cardItem, { backgroundColor: currentColors.card }]}>
                  <View style={styles.cardInfo}>
                    <IconSymbol name={getCardBrandIcon(card.cardBrand)} size={32} color={currentColors.primary} />
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
                      <View style={[styles.defaultBadge, { backgroundColor: currentColors.primary }]}>
                        <Text style={[styles.defaultBadgeText, { color: currentColors.card }]}>Default</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleSetDefault(card.stripePaymentMethodId)}
                        style={styles.setDefaultButton}
                        disabled={processing}
                      >
                        <Text style={[styles.setDefaultText, { color: currentColors.primary }]}>
                          Set as Default
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleRemoveCard(card.stripePaymentMethodId)}
                      style={styles.removeButton}
                      disabled={processing}
                    >
                      <IconSymbol name="trash" size={20} color={currentColors.accent} />
                    </Pressable>
                  </View>
                </View>
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
    </SafeAreaView>
  );
}
