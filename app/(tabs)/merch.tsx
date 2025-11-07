
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { merchItems } from '@/data/merchData';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function MerchScreen() {
  const { userProfile, redeemMerch, currentColors } = useApp();

  const handleRedeem = (merchId: string, pointsCost: number, merchName: string, inStock: boolean) => {
    console.log('Redeeming merch:', merchId);
    
    if (!inStock) {
      Alert.alert('Out of Stock', 'This item is currently out of stock.');
      return;
    }

    if (userProfile.points < pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${pointsCost - userProfile.points} more points to redeem this item.`
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Redeem Merch',
      `Redeem ${merchName} for ${pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            redeemMerch(merchId, pointsCost);
            Alert.alert('Success!', `You&apos;ve redeemed ${merchName}! We&apos;ll ship it to you soon.`);
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
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Merch Store</Text>
            <Text style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}>Redeem exclusive items with points</Text>
          </View>
        </View>

        <View style={[styles.pointsCard, { backgroundColor: currentColors.card }]}>
          <IconSymbol name="star.fill" size={32} color={currentColors.highlight} />
          <View style={styles.pointsInfo}>
            <Text style={[styles.pointsLabel, { color: currentColors.textSecondary }]}>Your Points</Text>
            <Text style={[styles.pointsValue, { color: currentColors.primary }]}>{userProfile.points}</Text>
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
          {merchItems.map((item) => (
            <View key={item.id} style={[styles.merchItem, { backgroundColor: currentColors.card }]}>
              <Image source={{ uri: item.image }} style={[styles.merchImage, { backgroundColor: currentColors.accent }]} />
              {!item.inStock && (
                <View style={[styles.outOfStockBadge, { backgroundColor: currentColors.textSecondary }]}>
                  <Text style={[styles.outOfStockText, { color: currentColors.card }]}>Out of Stock</Text>
                </View>
              )}
              <View style={styles.merchInfo}>
                <Text style={[styles.merchName, { color: currentColors.text }]}>{item.name}</Text>
                <Text style={[styles.merchDescription, { color: currentColors.textSecondary }]}>{item.description}</Text>
                <View style={styles.merchFooter}>
                  <View style={styles.pointsCostContainer}>
                    <IconSymbol name="star.fill" size={16} color={currentColors.highlight} />
                    <Text style={[styles.pointsCost, { color: currentColors.text }]}>{item.pointsCost} pts</Text>
                  </View>
                  <Pressable
                    style={[
                      styles.redeemButton,
                      { backgroundColor: currentColors.primary },
                      (!item.inStock || userProfile.points < item.pointsCost) && [
                        styles.redeemButtonDisabled,
                        { backgroundColor: currentColors.textSecondary, opacity: 0.5 }
                      ],
                    ]}
                    onPress={() => handleRedeem(item.id, item.pointsCost, item.name, item.inStock)}
                  >
                    <Text style={[styles.redeemButtonText, { color: currentColors.card }]}>Redeem</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
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
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
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
  merchItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  merchImage: {
    width: '100%',
    height: 200,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  merchInfo: {
    padding: 16,
  },
  merchName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  merchDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  merchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  redeemButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemButtonDisabled: {
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
