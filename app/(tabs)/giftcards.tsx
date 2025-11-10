
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
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';

const giftCardAmounts = [25, 50, 75, 100, 150, 200];

export default function GiftCardsScreen() {
  const { purchaseGiftCard, currentColors } = useApp();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');

  const handleAmountSelect = (amount: number) => {
    console.log('Amount selected:', amount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(amount);
  };

  const handlePurchase = () => {
    console.log('Purchasing gift card');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!recipientEmail || !recipientName) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const giftCard = {
      id: Date.now().toString(),
      amount: selectedAmount,
      recipientEmail,
      recipientName,
      message,
      code: `GC${Date.now().toString().slice(-8)}`,
    };

    purchaseGiftCard(giftCard);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Gift Card Purchased!',
      `A $${selectedAmount} gift card has been sent to ${recipientName} at ${recipientEmail}`,
      [{ text: 'OK' }]
    );

    setRecipientEmail('');
    setRecipientName('');
    setMessage('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Gift Cards</Text>
          <IconSymbol name="giftcard.fill" size={28} color={currentColors.primary} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: currentColors.textSecondary }]}>
            Share the love of authentic West African cuisine
          </Text>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Select Amount</Text>
            <View style={styles.amountGrid}>
              {giftCardAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  style={[
                    styles.amountButton,
                    { backgroundColor: currentColors.card },
                    selectedAmount === amount && { backgroundColor: currentColors.primary },
                  ]}
                  onPress={() => handleAmountSelect(amount)}
                >
                  <Text
                    style={[
                      styles.amountText,
                      { color: currentColors.text },
                      selectedAmount === amount && { color: currentColors.card },
                    ]}
                  >
                    ${amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Recipient Information */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Recipient Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Enter recipient's name"
              placeholderTextColor={currentColors.textSecondary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Recipient Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Enter recipient's email"
              placeholderTextColor={currentColors.textSecondary}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Personal Message (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Add a personal message..."
              placeholderTextColor={currentColors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: currentColors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Gift Card Amount</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${selectedAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: currentColors.primary }]}>${selectedAmount.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.purchaseButton, { backgroundColor: currentColors.primary }]}
            onPress={handlePurchase}
          >
            <IconSymbol name="giftcard.fill" size={20} color={currentColors.card} />
            <Text style={[styles.purchaseButtonText, { color: currentColors.card }]}>
              Purchase Gift Card
            </Text>
          </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  summary: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  purchaseButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
