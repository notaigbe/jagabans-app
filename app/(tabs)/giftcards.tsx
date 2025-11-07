
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

const giftCardAmounts = [25, 50, 75, 100];

export default function GiftCardsScreen() {
  const { purchaseGiftCard, currentColors } = useApp();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleAmountSelect = (amount: number) => {
    console.log('Amount selected:', amount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(amount);
  };

  const handlePurchase = () => {
    console.log('Purchasing gift card');
    
    if (!recipientName.trim() || !recipientEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter recipient name and email.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    purchaseGiftCard({
      id: Date.now().toString(),
      amount: selectedAmount,
      recipientName,
      recipientEmail,
      message: message.trim() || undefined,
    });

    Alert.alert(
      'Gift Card Sent!',
      `A $${selectedAmount} gift card has been sent to ${recipientName} at ${recipientEmail}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setRecipientName('');
            setRecipientEmail('');
            setMessage('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Gift Cards</Text>
            <Text style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}>Share the love of great food</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.giftCardPreview, { backgroundColor: currentColors.primary }]}>
            <View style={styles.giftCardDesign}>
              <Text style={[styles.giftCardBrand, { color: currentColors.card }]}>Jagabans LA</Text>
              <Text style={[styles.giftCardAmount, { color: currentColors.card }]}>${selectedAmount}</Text>
              <Text style={[styles.giftCardSubtext, { color: currentColors.card }]}>Gift Card</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Select Amount</Text>
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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Recipient Information</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Recipient Name"
              placeholderTextColor={currentColors.textSecondary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Recipient Email"
              placeholderTextColor={currentColors.textSecondary}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.messageInput, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Personal Message (Optional)"
              placeholderTextColor={currentColors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: currentColors.card }]}>
            <IconSymbol name="info.circle.fill" size={24} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.textSecondary }]}>
              Gift cards are delivered instantly via email and can be used for any menu items or merch.
            </Text>
          </View>

          <Pressable style={[styles.purchaseButton, { backgroundColor: currentColors.primary }]} onPress={handlePurchase}>
            <Text style={[styles.purchaseButtonText, { color: currentColors.card }]}>
              Purchase Gift Card - ${selectedAmount}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  giftCardPreview: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  giftCardDesign: {
    alignItems: 'center',
  },
  giftCardBrand: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  giftCardAmount: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  giftCardSubtext: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  messageInput: {
    minHeight: 100,
    paddingTop: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
