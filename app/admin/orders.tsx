
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Order, CartItem } from '@/types';
import { orderService, notificationService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';

interface OrderWithItems extends Order {
  items: CartItem[];
  userId?: string;
}

export default function AdminOrderManagement() {
  const router = useRouter();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      if (res.error) throw res.error;
      
      // Transform backend data to match Order interface
      const transformedOrders = (res.data || []).map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || 0,
        userId: order.user_id,
        items: (order.order_items || []).map((item: any) => ({
          id: item.id || item.item_id || '',
          name: item.item_name || item.name || '',
          description: item.description || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          category: item.category || '',
          image: item.image || '',
        })),
        total: order.total || 0,
        pointsEarned: order.points_earned || 0,
        date: order.created_at || new Date().toISOString(),
        status: order.status || 'pending',
        deliveryAddress: order.delivery_address,
        pickupNotes: order.pickup_notes,
      }));

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Failed to load orders', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: colors.text },
    { value: 'pending', label: 'Pending', color: '#FFA500' },
    { value: 'preparing', label: 'Preparing', color: '#4ECDC4' },
    { value: 'ready', label: 'Ready', color: '#95E1D3' },
    { value: 'completed', label: 'Completed', color: '#4CAF50' },
  ];

  const getStatusMessage = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is pending confirmation.';
      case 'preparing':
        return 'Your order is being prepared by our kitchen staff.';
      case 'ready':
        return 'Your order is ready for pickup or delivery!';
      case 'completed':
        return 'Your order has been completed. Thank you for your order!';
      default:
        return 'Your order status has been updated.';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status'], userId?: string) => {
    console.log('Changing order status:', orderId, newStatus);
    (async () => {
      try {
        const res = await orderService.updateOrderStatus(orderId, newStatus);
        if (res.error || !res.data) throw res.error || new Error('Update failed');
        
        // Transform the updated order
        const updatedOrder = res.data as any;
        const transformedOrder: OrderWithItems = {
          id: updatedOrder.id,
          orderNumber: updatedOrder.order_number || 0,
          userId: updatedOrder.user_id,
          items: (updatedOrder.order_items || []).map((item: any) => ({
            id: item.id || item.item_id || '',
            name: item.item_name || item.name || '',
            description: item.description || '',
            price: item.price || 0,
            quantity: item.quantity || 1,
            category: item.category || '',
            image: item.image || '',
          })),
          total: updatedOrder.total || 0,
          pointsEarned: updatedOrder.points_earned || 0,
          date: updatedOrder.created_at || new Date().toISOString(),
          status: updatedOrder.status || 'pending',
          deliveryAddress: updatedOrder.delivery_address,
          pickupNotes: updatedOrder.pickup_notes,
        };

        setOrders((prev) => prev.map((o) => (o.id === orderId ? transformedOrder : o)));

        // Send notification to user
        if (userId) {
          const statusMessage = getStatusMessage(newStatus);
          await notificationService.createNotification({
            userId,
            title: `Order #${transformedOrder.orderNumber} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            message: statusMessage,
            type: 'order',
            actionUrl: '/order-history',
          });
          console.log('Notification sent to user:', userId);
        }

        Alert.alert('Success', 'Order status updated and notification sent to customer');
      } catch (err) {
        console.error('Update order status failed', err);
        Alert.alert('Error', 'Unable to update order status');
      }
    })();
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'preparing':
        return '#4ECDC4';
      case 'ready':
        return '#95E1D3';
      case 'completed':
        return '#4CAF50';
      default:
        return colors.textSecondary;
    }
  };

  const filteredOrders =
    selectedStatus === 'all'
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Order Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.statusChip,
              selectedStatus === option.value && styles.statusChipActive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedStatus(option.value);
            }}
          >
            <Text
              style={[
                styles.statusChipText,
                selectedStatus === option.value && styles.statusChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : (
            <>
              {filteredOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderId}>Order #{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.date).toLocaleString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(order.status) }]}
                      >
                        {order.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderItems}>
                    {order.items.map((item: CartItem, index: number) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={styles.orderTotal}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.statusActions}>
                    <Text style={styles.actionsLabel}>Update Status:</Text>
                    <View style={styles.actionButtons}>
                      {(['pending', 'preparing', 'ready', 'completed'] as const).map(
                        (status) => (
                          <Pressable
                            key={status}
                            style={[
                              styles.actionButton,
                              order.status === status && styles.actionButtonActive,
                              { borderColor: getStatusColor(status) },
                            ]}
                            onPress={() => handleStatusChange(order.id, status, order.userId)}
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                order.status === status && {
                                  color: getStatusColor(status),
                                },
                              ]}
                            >
                              {status}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {filteredOrders.length === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol name="receipt-long" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No orders found</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statusFilter: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    maxHeight: 60,
  },
  statusFilterContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 13,
    color: colors.text,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ordersContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    gap: 8,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 16,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  actionButtonActive: {
    backgroundColor: colors.card,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
