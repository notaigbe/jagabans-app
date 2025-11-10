
import { useApp } from '@/contexts/AppContext';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
import { IconSymbol } from '@/components/IconSymbol';

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, currentColors } = useApp();
  const router = useRouter();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleQuantityChange = (itemId: string, change: number) => {
    console.log('Quantity change:', itemId, change);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      updateCartQuantity(itemId, item.quantity + change);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('Removing item:', itemId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeFromCart(itemId);
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    console.log('Proceeding to checkout');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return;
    }
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Shopping Cart</Text>
          <Text style={[styles.itemCount, { color: currentColors.textSecondary }]}>
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={80} color={currentColors.textSecondary} />
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
              Your cart is empty
            </Text>
            <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
              Add some delicious items to get started!
            </Text>
            <Pressable
              style={[styles.browseButton, { backgroundColor: currentColors.primary }]}
              onPress={() => router.push('/(tabs)/(home)/')}
            >
              <Text style={[styles.browseButtonText, { color: currentColors.card }]}>
                Browse Menu
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.cartList}
              contentContainerStyle={styles.cartListContent}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item.id} style={[styles.cartItem, { backgroundColor: currentColors.card }]}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: currentColors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, { color: currentColors.primary }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                    <View style={styles.quantityContainer}>
                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: currentColors.accent }]}
                        onPress={() => handleQuantityChange(item.id, -1)}
                      >
                        <IconSymbol name="minus" size={16} color={currentColors.text} />
                      </Pressable>
                      <Text style={[styles.quantity, { color: currentColors.text }]}>{item.quantity}</Text>
                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: currentColors.accent }]}
                        onPress={() => handleQuantityChange(item.id, 1)}
                      >
                        <IconSymbol name="plus" size={16} color={currentColors.text} />
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <IconSymbol name="trash" size={20} color={currentColors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: currentColors.card }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (8%)</Text>
                <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
              </View>
              <Pressable
                style={[styles.checkoutButton, { backgroundColor: currentColors.primary }]}
                onPress={handleCheckout}
              >
                <Text style={[styles.checkoutButtonText, { color: currentColors.card }]}>
                  Proceed to Checkout
                </Text>
                <IconSymbol name="arrow.right" size={20} color={currentColors.card} />
              </Pressable>
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  summary: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
