
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

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { userProfile, currentColors } = useApp();

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
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Order History</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {userProfile.orders.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="bag" size={64} color={currentColors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Orders Yet</Text>
              <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                Start ordering delicious food to see your order history here
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.statsCard, { backgroundColor: currentColors.card }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: currentColors.primary }]}>{userProfile.orders.length}</Text>
                  <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Total Orders</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: currentColors.textSecondary + '30' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: currentColors.primary }]}>
                    ${userProfile.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </Text>
                  <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Total Spent</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: currentColors.textSecondary + '30' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: currentColors.primary }]}>
                    {userProfile.orders.reduce((sum, order) => sum + order.pointsEarned, 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Points Earned</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>All Orders</Text>

              {userProfile.orders.map((order) => (
                <View key={order.id} style={[styles.orderCard, { backgroundColor: currentColors.card }]}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={[styles.orderId, { color: currentColors.text }]}>Order #{order.id.slice(-6)}</Text>
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
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(order.status) }]}>
                      <Text style={[styles.statusText, { color: currentColors.card }]}>{order.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.orderDivider, { backgroundColor: currentColors.textSecondary + '20' }]} />

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

                  <View style={[styles.orderDivider, { backgroundColor: currentColors.textSecondary + '20' }]} />

                  <View style={styles.orderFooter}>
                    <View style={styles.orderTotalRow}>
                      <Text style={[styles.orderTotalLabel, { color: currentColors.text }]}>Total</Text>
                      <Text style={[styles.orderTotal, { color: currentColors.primary }]}>${order.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.orderPoints}>
                      <IconSymbol name="star.fill" size={16} color={currentColors.highlight} />
                      <Text style={[styles.orderPointsText, { color: currentColors.text }]}>
                        +{order.pointsEarned} points earned
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
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
  statsCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDivider: {
    height: 1,
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
    fontWeight: '600',
    width: 40,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderPointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
