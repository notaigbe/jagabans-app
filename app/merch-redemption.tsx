
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';

export default function MerchRedemptionScreen() {
  const router = useRouter();
  const { merchId, pointsCost, merchName } = useLocalSearchParams();
  const { userProfile, redeemMerch, currentColors, setTabBarVisible } = useApp();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const setTabBarVisibleCallback = useCallback(() => {
    setTabBarVisible(false);
    return () => {
      setTabBarVisible(true);
    };
  }, [setTabBarVisible]);

  useEffect(() => {
    return setTabBarVisibleCallback();
  }, [setTabBarVisibleCallback]);

  // Use 0 points if userProfile is null
  const currentPoints = userProfile?.points || 0;
  const requiredPoints = parseInt(pointsCost as string);
  const hasEnoughPoints = currentPoints >= requiredPoints;

  const handleRedeem = () => {
    console.log('Redeeming merch with address');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!deliveryAddress.trim()) {
      showDialog('Missing Information', 'Please enter a delivery address.', [
        { text: 'OK', onPress: () => {}, style: 'default' }
      ]);
      return;
    }

    const points = parseInt(pointsCost as string);
    
    if (currentPoints < points) {
      showDialog(
        'Insufficient Points',
        `You need ${points - currentPoints} more points to redeem this item.`,
        [{ text: 'OK', onPress: () => {}, style: 'default' }]
      );
      return;
    }

    redeemMerch(
      merchId as string,
      merchName as string,
      points,
      deliveryAddress,
      pickupNotes || undefined
    );

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    showDialog(
      'Success!',
      `You've redeemed ${merchName}! We'll process your order and contact you soon.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
          style: 'default'
        },
      ]
    );
  };

  const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  itemCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  redeemButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
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
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Redeem Merch</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Item Info */}
          <View style={[styles.itemCard, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.itemName, { color: currentColors.text }]}>{merchName}</Text>
            <View style={styles.pointsRow}>
              <IconSymbol name="star.fill" size={20} color={currentColors.primary} />
              <Text style={[styles.pointsCost, { color: currentColors.primary }]}>
                {pointsCost} points
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Customers primarily pick up orders. Please provide your address for delivery and any pickup notes below.
            </Text>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Delivery Address *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Enter your delivery address"
              placeholderTextColor={currentColors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Pickup Notes */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: currentColors.text }]}>Pickup Notes (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: currentColors.card, color: currentColors.text }]}
              placeholder="Add any special instructions for pickup..."
              placeholderTextColor={currentColors.textSecondary}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: currentColors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
                Your Points
              </Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>
                {currentPoints} pts
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
                Points Required
              </Text>
              <Text style={[styles.summaryValue, { color: currentColors.primary }]}>
                {pointsCost} pts
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.background }]}>
              <Text style={[styles.totalLabel, { color: currentColors.text }]}>
                Remaining Points
              </Text>
              <Text style={[styles.totalValue, { color: currentColors.primary }]}>
                {currentPoints - parseInt(pointsCost as string)} pts
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: currentColors.card, borderTopColor: currentColors.background }]}>
          <Pressable
            style={[
              styles.redeemButton, 
              { backgroundColor: hasEnoughPoints ? currentColors.primary : currentColors.textSecondary }
            ]}
            onPress={handleRedeem}
            disabled={!hasEnoughPoints}
          >
            <Text style={[styles.redeemButtonText, { color: currentColors.card }]}>
              {hasEnoughPoints 
                ? `Redeem for ${pointsCost} Points` 
                : `Need ${requiredPoints - currentPoints} More Points`
              }
            </Text>
          </Pressable>
        </View>
      </View>
      <Dialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        buttons={dialogConfig.buttons}
        onHide={() => setDialogVisible(false)}
        currentColors={currentColors}
      />
    </SafeAreaView>
  );
}
