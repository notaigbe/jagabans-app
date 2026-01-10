
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { DeliveryTracking } from '@/components/DeliveryTracking';
import Dialog from '@/components/Dialog';
import { supabase } from '@/app/integrations/supabase/client';
import type { Order } from '@/types';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { userProfile, currentColors, refreshUserProfile, showToast } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canModify, setCanModify] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>,
  });

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      // Get cancellation_deadline from the order
      const deadline = order.cancellationDeadline;
      if (!deadline) {
        setTimeRemaining(0);
        setCanModify(false);
        return;
      }

      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const remaining = Math.max(0, deadlineTime - now);

      setTimeRemaining(remaining);
      setCanModify(remaining > 0 && order.status !== 'cancelled');
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order from database
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (data) {
        // Transform database order to app Order type
        const transformedOrder: Order = {
          id: data.id,
          orderNumber: data.order_number,
          items: data.items,
          total: data.total,
          pointsEarned: data.points_earned,
          date: data.created_at,
          status: data.status,
          deliveryAddress: data.delivery_address,
          pickupNotes: data.pickup_notes,
          paymentId: data.payment_id,
          uberDeliveryId: data.uber_delivery_id,
          uberDeliveryStatus: data.uber_delivery_status,
          uberTrackingUrl: data.uber_tracking_url,
          doordashDeliveryId: data.doordash_delivery_id,
          doordashDeliveryStatus: data.doordash_delivery_status,
          doordashTrackingUrl: data.doordash_tracking_url,
          deliveryProvider: data.delivery_provider,
          cancellationDeadline: data.cancellation_deadline,
        };
        setOrder(transformedOrder);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCancelOrder = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setDialogConfig({
      visible: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      buttons: [
        {
          text: 'No, Keep Order',
          onPress: () => setDialogConfig(prev => ({ ...prev, visible: false })),
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel Order',
          onPress: async () => {
            setDialogConfig(prev => ({ ...prev, visible: false }));
            await confirmCancelOrder();
          },
          style: 'destructive',
        },
      ],
    });
  };

  const confirmCancelOrder = async () => {
    try {
      if (!order) return;

      // Update order status to cancelled
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      // Refund points to user
      const { error: pointsError } = await supabase.rpc('add_points_to_user', {
        user_id: userProfile?.id,
        points_to_add: order.pointsEarned,
      });

      if (pointsError) {
        console.error('Error refunding points:', pointsError);
      }

      showToast('Order cancelled successfully', 'success');
      await refreshUserProfile();
      await loadOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order', 'error');
    }
  };

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
      case 'cancelled':
        return '#EF4444';
      default:
        return currentColors.textSecondary;
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
            <Text style={[styles.loadingText, { color: currentColors.text }]}>Loading order details...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient
        colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.errorContainer}>
            <IconSymbol 
            name="exclamationmark.triangle" 
            // android_material_icon_name="error" 
            size={80} 
            color={currentColors.textSecondary} />
            <Text style={[styles.errorText, { color: currentColors.text }]}>Order not found</Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backToHistoryButton, { backgroundColor: currentColors.primary }]}
            >
              <Text style={[styles.backToHistoryText, { color: currentColors.background }]}>Back to Order History</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
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
              <IconSymbol 
              name="arrow.left" 
              // android_material_icon_name="arrow-back" 
              size={24} 
              color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Order Details</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Order Header Card */}
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: currentColors.border }]}
            >
              <View style={styles.orderHeaderRow}>
                <View>
                  <Text style={[styles.orderNumber, { color: currentColors.text }]}>Order #{order.orderNumber}</Text>
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
                  <Text style={[styles.statusText, { color: currentColors.background }]}>{order.status}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Modification Timer */}
            {canModify && timeRemaining > 0 && (
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.timerCard, { borderColor: '#F59E0B' }]}
              >
                <IconSymbol 
                name="clock" 
                // android_material_icon_name="schedule" 
                size={24} 
                color="#92400E" />
                <View style={styles.timerContent}>
                  <Text style={styles.timerTitle}>Time to modify or cancel</Text>
                  <Text style={styles.timerValue}>{formatTimeRemaining(timeRemaining)}</Text>
                </View>
              </LinearGradient>
            )}

            {/* Order Items */}
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { borderColor: currentColors.border }]}
            >
              <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Order Items</Text>
              <View style={styles.itemsList}>
                {order.items.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.orderItem}>
                    <Text style={[styles.itemQuantity, { color: currentColors.textSecondary }]}>{item.quantity}x</Text>
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, { color: currentColors.text }]}>{item.name}</Text>
                      <Text style={[styles.itemDescription, { color: currentColors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <Text style={[styles.itemPrice, { color: currentColors.text }]}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.divider, { backgroundColor: currentColors.border }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: currentColors.secondary }]}>${order.total.toFixed(2)}</Text>
              </View>

              <View style={styles.pointsRow}>
                <IconSymbol 
                name="star.fill" 
                // android_material_icon_name="star" 
                size={20} 
                color={currentColors.highlight} />
                <Text style={[styles.pointsText, { color: currentColors.text }]}>
                  +{order.pointsEarned} points earned
                </Text>
              </View>
            </LinearGradient>

            {/* Delivery Information */}
            {order.deliveryAddress && (
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { borderColor: currentColors.border }]}
              >
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Address</Text>
                <View style={styles.addressRow}>
                  <IconSymbol 
                  name="location.fill" 
                  // android_material_icon_name="location-on" 
                  size={20} 
                  color={currentColors.secondary} />
                  <Text style={[styles.addressText, { color: currentColors.text }]}>{order.deliveryAddress}</Text>
                </View>
              </LinearGradient>
            )}

            {/* Pickup Notes */}
            {order.pickupNotes && (
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { borderColor: currentColors.border }]}
              >
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Pickup Notes</Text>
                <Text style={[styles.notesText, { color: currentColors.textSecondary }]}>{order.pickupNotes}</Text>
              </LinearGradient>
            )}

            {/* Delivery Tracking */}
            {(order.uberDeliveryId || order.doordashDeliveryId) && (
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { borderColor: currentColors.border }]}
              >
                <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Delivery Tracking</Text>
                <DeliveryTracking order={order} onRefresh={loadOrderDetails} />
              </LinearGradient>
            )}

            {/* Action Buttons */}
            {canModify && order.status !== 'cancelled' && (
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cancelButton}
              >
                <Pressable
                  style={styles.cancelButtonInner}
                  onPress={handleCancelOrder}
                >
                  <IconSymbol 
                  name="xmark.circle" 
                  // android_material_icon_name="cancel" 
                  size={20} 
                  color="#991B1B" />
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </Pressable>
              </LinearGradient>
            )}
          </ScrollView>
        </View>

        {/* Dialog - No children prop, only the accepted props */}
        <Dialog
          visible={dialogConfig.visible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
          onHide={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
          currentColors={currentColors}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cormorant_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  errorText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  backToHistoryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backToHistoryText: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
  },
  card: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Cormorant_600SemiBold',
    textTransform: 'capitalize',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerTitle: {
    fontSize: 14,
    fontFamily: 'Cormorant_600SemiBold',
    color: '#92400E',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#92400E',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 16,
  },
  itemsList: {
    gap: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    width: 40,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Cormorant_400Regular',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Cormorant_700Bold',
  },
  divider: {
    height: 2,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  totalValue: {
    fontSize: 24,
    fontFamily: 'Cormorant_700Bold',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: 'Cormorant_600SemiBold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Cormorant_400Regular',
    lineHeight: 24,
  },
  notesText: {
    fontSize: 16,
    fontFamily: 'Cormorant_400Regular',
    lineHeight: 24,
  },
  cancelButton: {
    borderRadius: 0,
    marginTop: 8,
    boxShadow: '0px 8px 24px rgba(239, 68, 68, 0.3)',
    elevation: 8,
  },
  cancelButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cormorant_700Bold',
    color: '#991B1B',
  },
});
