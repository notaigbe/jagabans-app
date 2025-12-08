
import { useApp } from '@/contexts/AppContext';
import type { CartItem } from '@/contexts/AppContext';
import React, { useState } from 'react';
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
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, currentColors } = useApp();
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'remove' | 'empty'>('remove');
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemToRemove(itemId);
    setDialogVisible(true);
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      removeFromCart(itemToRemove);
      setItemToRemove(null);
    }
  };

  const handleCheckout = () => {
    console.log('Proceeding to checkout');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cart.length === 0) {
      setDialogType('empty');
      setDialogVisible(true);
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
            <IconSymbol name="cart.fill" size={80} color={currentColors.textSecondary} />
            <Text style={[styles.emptyText, { color: currentColors.text }]}>
              Your cart is empty
            </Text>
            <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
              Add some delicious items to get started!
            </Text>
            <Pressable
              style={[styles.browseButton, { backgroundColor: currentColors.secondary }]}
              onPress={() => router.push('/')}
            >
              <Text style={[styles.browseButtonText, { color: currentColors.background }]}>
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
                <View key={item.id} style={[styles.cartItem, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                  <View style={[styles.imageContainer, { borderColor: currentColors.border }]}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: currentColors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, { color: currentColors.secondary }]}>
                      ${item.price.toFixed(2)}
                    </Text>
                    <View style={styles.quantityContainer}>
                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
                        onPress={() => handleQuantityChange(item.id, -1)}
                      >
                        <IconSymbol name="minus" size={16} color={currentColors.secondary} />
                      </Pressable>
                      <Text style={[styles.quantity, { color: currentColors.text }]}>{item.quantity}</Text>
                      <Pressable
                        style={[styles.quantityButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
                        onPress={() => handleQuantityChange(item.id, 1)}
                      >
                        <IconSymbol name="plus" size={16} color={currentColors.secondary} />
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
            <View style={[styles.summary, { backgroundColor: currentColors.card, borderTopColor: currentColors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: currentColors.text }]}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>Tax (8%)</Text>
                <Text style={[styles.summaryValue, { color: currentColors.text }]}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.border }]}>
                <Text style={[styles.totalLabel, { color: currentColors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: currentColors.secondary }]}>${total.toFixed(2)}</Text>
              </View>
              <Pressable
                style={[styles.checkoutButton, { backgroundColor: currentColors.secondary }]}
                onPress={handleCheckout}
              >
                <Text style={[styles.checkoutButtonText, { color: currentColors.background }]}>
                  Proceed to Checkout
                </Text>
                <IconSymbol name="arrow.right" size={20} color={currentColors.background} />
              </Pressable>
            </View>
          </>
        )}
      </View>
      <Dialog
        visible={dialogVisible}
        title={dialogType === 'remove' ? 'Remove Item' : 'Empty Cart'}
        message={
          dialogType === 'remove'
            ? 'Are you sure you want to remove this item from your cart?'
            : 'Please add items to your cart before checking out.'
        }
        buttons={
          dialogType === 'remove'
            ? [
                {
                  text: 'Cancel',
                  onPress: () => setItemToRemove(null),
                  style: 'cancel',
                },
                {
                  text: 'Remove',
                  onPress: handleConfirmRemove,
                  style: 'destructive',
                },
              ]
            : [
                {
                  text: 'OK',
                  onPress: () => {},
                  style: 'default',
                },
              ]
        }
        onHide={() => {
          setDialogVisible(false);
          setItemToRemove(null);
        }}
        currentColors={currentColors}
      />
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
    borderRadius: 0,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.1)',
    elevation: 3,
  },
  imageContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 0,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
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
    borderWidth: 1,
  },
  quantity: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
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
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.3)',
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
