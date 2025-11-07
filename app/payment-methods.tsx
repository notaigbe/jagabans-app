
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { PaymentMethod } from '@/types';
import * as Haptics from 'expo-haptics';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { userProfile, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod, currentColors } = useApp();
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleAddCard = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number');
      return;
    }

    if (expiryDate.length !== 5) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return;
    }

    if (cvv.length !== 3) {
      Alert.alert('Error', 'Please enter a valid 3-digit CVV');
      return;
    }

    const newPaymentMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'credit',
      cardNumber: `**** **** **** ${cleanedCardNumber.slice(-4)}`,
      cardholderName,
      expiryDate,
      isDefault: false,
    };

    addPaymentMethod(newPaymentMethod);
    setShowAddCard(false);
    setCardNumber('');
    setCardholderName('');
    setExpiryDate('');
    setCvv('');
    Alert.alert('Success', 'Payment method added successfully!');
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
          onPress: () => removePaymentMethod(paymentMethodId),
        },
      ]
    );
  };

  const handleSetDefault = (paymentMethodId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDefaultPaymentMethod(paymentMethodId);
  };

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
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Payment Methods</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {userProfile.paymentMethods.length === 0 && !showAddCard ? (
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard" size={64} color={currentColors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Payment Methods</Text>
              <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                Add a payment method to make checkout faster and easier
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {userProfile.paymentMethods.map((method) => (
                <View key={method.id} style={[styles.cardItem, { backgroundColor: currentColors.card }]}>
                  <View style={styles.cardInfo}>
                    <IconSymbol name="creditcard.fill" size={32} color={currentColors.primary} />
                    <View style={styles.cardDetails}>
                      <Text style={[styles.cardNumber, { color: currentColors.text }]}>{method.cardNumber}</Text>
                      <Text style={[styles.cardHolder, { color: currentColors.textSecondary }]}>{method.cardholderName}</Text>
                      <Text style={[styles.cardExpiry, { color: currentColors.textSecondary }]}>Expires {method.expiryDate}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {method.isDefault ? (
                      <View style={[styles.defaultBadge, { backgroundColor: currentColors.primary }]}>
                        <Text style={[styles.defaultBadgeText, { color: currentColors.card }]}>Default</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleSetDefault(method.id)}
                        style={styles.setDefaultButton}
                      >
                        <Text style={[styles.setDefaultText, { color: currentColors.primary }]}>Set as Default</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleRemoveCard(method.id)}
                      style={styles.removeButton}
                    >
                      <IconSymbol name="trash" size={20} color={currentColors.accent} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {showAddCard && (
            <View style={[styles.addCardForm, { backgroundColor: currentColors.card }]}>
              <Text style={[styles.formTitle, { color: currentColors.text }]}>Add New Card</Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentColors.text }]}>Card Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentColors.background, color: currentColors.text, borderColor: currentColors.textSecondary + '30' }]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={currentColors.textSecondary}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentColors.text }]}>Cardholder Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentColors.background, color: currentColors.text, borderColor: currentColors.textSecondary + '30' }]}
                  placeholder="John Doe"
                  placeholderTextColor={currentColors.textSecondary}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.inputLabel, { color: currentColors.text }]}>Expiry Date</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: currentColors.background, color: currentColors.text, borderColor: currentColors.textSecondary + '30' }]}
                    placeholder="MM/YY"
                    placeholderTextColor={currentColors.textSecondary}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.inputLabel, { color: currentColors.text }]}>CVV</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: currentColors.background, color: currentColors.text, borderColor: currentColors.textSecondary + '30' }]}
                    placeholder="123"
                    placeholderTextColor={currentColors.textSecondary}
                    value={cvv}
                    onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                <Pressable
                  style={[styles.button, styles.cancelButton, { backgroundColor: currentColors.background }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAddCard(false);
                    setCardNumber('');
                    setCardholderName('');
                    setExpiryDate('');
                    setCvv('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: currentColors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.addButton, { backgroundColor: currentColors.primary }]}
                  onPress={handleAddCard}
                >
                  <Text style={[styles.addButtonText, { color: currentColors.card }]}>Add Card</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!showAddCard && (
            <Pressable
              style={[styles.addNewButton, { backgroundColor: currentColors.card }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowAddCard(true);
              }}
            >
              <IconSymbol name="plus.circle.fill" size={24} color={currentColors.primary} />
              <Text style={[styles.addNewButtonText, { color: currentColors.primary }]}>Add New Payment Method</Text>
            </Pressable>
          )}

          <View style={styles.securityNote}>
            <IconSymbol name="lock.fill" size={20} color={currentColors.textSecondary} />
            <Text style={[styles.securityNoteText, { color: currentColors.textSecondary }]}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
    padding: 4,
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
  addCardForm: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
