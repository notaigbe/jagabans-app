
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
import { supabase } from '@/app/integrations/supabase/client';
import {
  SQIPCardEntry,
  SQIPCore,
} from 'react-native-square-in-app-payments';

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

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { userProfile, currentColors, loadUserProfile } = useApp();
  
  const [storedCards, setStoredCards] = useState<StoredCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const initializeSquare = async () => {
    try {
      const applicationId = 'sandbox-sq0idb-YOUR_APP_ID'; // Replace with actual app ID
      await SQIPCore.setSquareApplicationId(applicationId);
      console.log('Square SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Square SDK:', error);
    }
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

      if (data && data.length > 0) {
        const cards: StoredCard[] = data.map((card: any) => ({
          id: card.id,
          cardBrand: card.type,
          last4: card.card_number.slice(-4),
          expMonth: card.expiry_date.slice(0, 2),
          expYear: card.expiry_date.slice(2, 4),
          cardholderName: card.cardholder_name,
          isDefault: card.is_default,
          // squareCardId: card.square_card_id,
          // squareCustomerId: card.square_customer_id,
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
      initializeSquare();
    }
  }, [userProfile, loadStoredCards]);

  const handleAddCard = async () => {
    try {
      setProcessing(true);
      
      await SQIPCardEntry.startCardEntryFlow(
        {
          collectPostalCode: true,
          skipCardHolderName: false,
        },
        async (cardDetails) => {
          console.log('Card nonce received:', cardDetails.nonce);
          
          // Here you would typically make a small charge or create a customer
          // For now, we'll show a message that the card needs to be added during checkout
          showToast('info', 'Please add your card during checkout to save it for future use.');
          setProcessing(false);
        },
        (error) => {
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
  };

  const handleSetDefault = async (cardId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      setProcessing(true);

      // Update all cards to not be default
      await supabase
        .from('square_cards')
        .update({ is_default: false })
        .eq('user_id', userProfile!.id);

      // Set the selected card as default
      const { error } = await supabase
        .from('square_cards')
        .update({ is_default: true })
        .eq('id', cardId);

      if (error) throw error;

      showToast('success', 'Default card updated successfully');
      await loadStoredCards();
    } catch (error) {
      console.error('Error setting default card:', error);
      showToast('error', 'Failed to update default card');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
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

              const { error } = await supabase
                .from('square_cards')
                .delete()
                .eq('id', cardId);

              if (error) throw error;

              showToast('success', 'Payment method removed successfully');
              await loadStoredCards();
            } catch (error) {
              console.error('Error removing card:', error);
              showToast('error', 'Failed to remove payment method');
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
      borderRadius: 16,
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
    cardHolder: {
      fontSize: 14,
      marginBottom: 2,
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
              Cards are securely saved during checkout. Add items to your cart and complete a purchase to save a new card.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentColors.primary} />
              <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
                Loading saved cards...
              </Text>
            </View>
          ) : storedCards.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard" size={64} color={currentColors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Payment Methods</Text>
              <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                You haven&apos;t saved any payment methods yet. Complete a purchase and choose to save your card for faster checkout next time.
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
                        {card.cardBrand} •••• {card.last4}
                      </Text>
                      {card.cardholderName && (
                        <Text style={[styles.cardHolder, { color: currentColors.textSecondary }]}>
                          {card.cardholderName}
                        </Text>
                      )}
                      <Text style={[styles.cardExpiry, { color: currentColors.textSecondary }]}>
                        Expires {card.expMonth}/{card.expYear}
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
                        onPress={() => handleSetDefault(card.id)}
                        style={styles.setDefaultButton}
                        disabled={processing}
                      >
                        <Text style={[styles.setDefaultText, { color: currentColors.primary }]}>
                          Set as Default
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleRemoveCard(card.id)}
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
