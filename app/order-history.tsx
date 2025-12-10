
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { DeliveryTracking } from '@/components/DeliveryTracking';
import { orderService } from '@/services/supabaseService';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { userProfile, currentColors, refreshUserProfile } = useApp();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return currentColors.highlight;
      case 'preparing':
        return currentColors.secondary;
      case 'ready':
        return currentColors.accent;
      case 'completed':
        return currentColors.primary;
      default:
        return currentColors.textSecondary;
    }
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
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Order History</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!userProfile || userProfile.orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="bag" size={80} color={currentColors.textSecondary} />
                <Text style={[styles.emptyText, { color: currentColors.text }]}>No Orders Yet</Text>
                <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
                  Start ordering delicious food to see your order history here
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient
                  colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.statsCard, { borderColor: currentColors.border }]}
                >
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: currentColors.secondary }]}>{userProfile?.orders?.length}</Text>
                    <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Total Orders</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: currentColors.border }]} />
                  {/* <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: currentColors.secondary }]}>
                      ${userProfile?.orders?.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Total Spent</Text>
                  </View> */}
                  {/* <View style={[styles.statDivider, { backgroundColor: currentColors.border }]} /> */}
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: currentColors.secondary }]}>
                      {userProfile?.orders?.reduce((sum, order) => sum + order.pointsEarned, 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Points Earned</Text>
                  </View>
                </LinearGradient>

                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>All Orders</Text>

                {userProfile?.orders?.map((order) => (
                  <LinearGradient
                    key={order.id}
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.orderCard, { borderColor: currentColors.border }]}
                  >
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={[styles.orderId, { color: currentColors.text }]}>Order #{order.orderNumber}</Text>
                        <Text style={[styles.orderDate, { color: currentColors.textSecondary }]}>
                          {new Date(order.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      
                    </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(order.status) }]}>
                        <Text style={[styles.statusText, { color: currentColors.background }]}>{order.status}</Text>
                      </View>
                    <View style={[styles.orderDivider, { backgroundColor: currentColors.border }]} />

                    <View style={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <View key={`${item.id}-${index}`} style={styles.orderItem}>
                          <Text style={[styles.itemQuantity, { color: currentColors.textSecondary }]}>{item.quantity}x</Text>
                          <Text style={[styles.itemName, { color: currentColors.text }]}>{item.name}</Text>
                          <Text style={[styles.itemPrice, { color: currentColors.text }]}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.orderDivider, { backgroundColor: currentColors.border }]} />

                    <View style={styles.orderFooter}>
                      <View style={styles.orderTotalRow}>
                        <Text style={[styles.orderTotalLabel, { color: currentColors.text }]}>Total</Text>
                        <Text style={[styles.orderTotal, { color: currentColors.secondary }]}>${order.total.toFixed(2)}</Text>
                      </View>
                      <View style={styles.orderPoints}>
                        <IconSymbol name="star.fill" size={16} color={currentColors.highlight} />
                        <Text style={[styles.orderPointsText, { color: currentColors.text }]}>
                          +{order.pointsEarned} points earned
                        </Text>
                      </View>
                    </View>

                    {order.uberDeliveryId && (
                      <View style={styles.deliveryTrackingContainer}>
                        <DeliveryTracking 
                          order={order} 
                          onRefresh={refreshUserProfile}
                        />
                      </View>
                    )}
                  </LinearGradient>
                ))}
              </>
            )}
          </ScrollView>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 0,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  statDivider: {
    width: 2,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 16,
  },
  orderCard: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    // boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  orderDivider: {
    height: 2,
    marginVertical: 16,
  },
  orderItems: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    width: 40,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  orderFooter: {
    gap: 12,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  orderTotal: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  orderPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderPointsText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  deliveryTrackingContainer: {
    marginTop: 16,
    paddingTop: 16,
  },
});
