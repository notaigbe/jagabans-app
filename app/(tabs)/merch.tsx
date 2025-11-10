
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
import { useApp } from '@/contexts/AppContext';
import { merchItems } from '@/data/merchData';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';

export default function MerchScreen() {
  const { userProfile, redeemMerch, currentColors } = useApp();

  const handleRedeem = (merchId: string, pointsCost: number, merchName: string) => {
    console.log('Redeeming merch:', merchId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (userProfile.points < pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${pointsCost - userProfile.points} more points to redeem this item.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Redeem Item',
      `Redeem ${merchName} for ${pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            redeemMerch(merchId, pointsCost);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success!', `You've redeemed ${merchName}!`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Merch Store</Text>
          <View style={[styles.pointsBadge, { backgroundColor: currentColors.primary }]}>
            <IconSymbol name="star.fill" size={16} color={currentColors.card} />
            <Text style={[styles.pointsText, { color: currentColors.card }]}>
              {userProfile.points} pts
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.merchList}
          contentContainerStyle={styles.merchListContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: currentColors.textSecondary }]}>
            Redeem your points for exclusive merchandise
          </Text>

          {merchItems.map((item) => {
            const canAfford = userProfile.points >= item.pointsCost;
            return (
              <View key={item.id} style={[styles.merchItem, { backgroundColor: currentColors.card }]}>
                <Image source={{ uri: item.image }} style={styles.merchImage} />
                <View style={styles.merchInfo}>
                  <Text style={[styles.merchName, { color: currentColors.text }]}>{item.name}</Text>
                  <Text style={[styles.merchDescription, { color: currentColors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.merchFooter}>
                    <View style={styles.pointsContainer}>
                      <IconSymbol name="star.fill" size={16} color={currentColors.primary} />
                      <Text style={[styles.pointsCost, { color: currentColors.primary }]}>
                        {item.pointsCost} points
                      </Text>
                    </View>
                    <Pressable
                      style={[
                        styles.redeemButton,
                        { backgroundColor: canAfford ? currentColors.primary : currentColors.textSecondary },
                      ]}
                      onPress={() => handleRedeem(item.id, item.pointsCost, item.name)}
                      disabled={!canAfford}
                    >
                      <Text style={[styles.redeemButtonText, { color: currentColors.card }]}>
                        {canAfford ? 'Redeem' : 'Not Enough'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  merchList: {
    flex: 1,
  },
  merchListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  merchItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  merchImage: {
    width: '100%',
    height: 200,
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
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  redeemButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
