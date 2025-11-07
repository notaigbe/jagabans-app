
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
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
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, currentColors } = useApp();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  const handleQuantityChange = (itemId: string, change: number) => {
    console.log('Updating quantity:', itemId, change);
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateCartQuantity(itemId, item.quantity + change);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('Removing item:', itemId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Remove Item', 'Remove this item from cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFromCart(itemId),
      },
    ]);
  };

  const handleCheckout = () => {
    console.log('Proceeding to checkout');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Cart</Text>
          </View>
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={80} color={currentColors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: currentColors.text }]}>Your cart is empty</Text>
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
              Add some delicious items to get started!
            </Text>
            <Pressable
              style={[styles.browseButton, { backgroundColor: currentColors.primary }]}
              onPress={() => router.push('/(tabs)/(home)')}
            >
              <Text style={[styles.browseButtonText, { color: currentColors.card }]}>Browse Menu</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Cart</Text>
          <Text style={[styles.itemCount, { color: currentColors.textSecondary }]}>
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {cart.map((item) => (
            <View key={item.id} style={[styles.cartItem, { backgroundColor: currentColors.card }]}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: currentColors.text }]}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: currentColors.primary }]}>
                  ${item.price.toFixed(2)}
                </Text>
                <View style={styles.quantityContainer}>
                  <Pressable
                    style={[styles.quantityButton, { backgroundColor: currentColors.background }]}
                    onPress={() => handleQuantityChange(item.id, -1)}
                  >
                    <IconSymbol name="minus" size={16} color={currentColors.text} />
                  </Pressable>
                  <Text style={[styles.quantity, { color: currentColors.text }]}>{item.quantity}</Text>
                  <Pressable
                    style={[styles.quantityButton, { backgroundColor: currentColors.background }]}
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

          <View style={[styles.summaryCard, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.summaryTitle, { color: currentColors.text }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (8.75%)</Text>
              <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: currentColors.textSecondary + '30' }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: currentColors.card, borderTopColor: currentColors.textSecondary + '30' }]}>
          <View style={styles.footerContent}>
            <View>
              <Text style={[styles.footerLabel, { color: currentColors.textSecondary }]}>Total</Text>
              <Text style={[styles.footerTotal, { color: currentColors.primary }]}>${total.toFixed(2)}</Text>
            </View>
            <Pressable style={[styles.checkoutButton, { backgroundColor: currentColors.primary }]} onPress={handleCheckout}>
              <Text style={[styles.checkoutButtonText, { color: currentColors.card }]}>Checkout</Text>
              <IconSymbol name="arrow.right" size={20} color={currentColors.card} />
            </Pressable>
          </View>
        </View>
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
  itemCount: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  cartItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
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
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
  },
  footerTotal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
