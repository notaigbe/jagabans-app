
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { menuItems } from '@/data/menuData';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, currentColors } = useApp();
  const [quantity, setQuantity] = useState(1);

  const item = menuItems.find((i) => i.id === id);

  if (!item) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              console.log('Back button pressed');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
            <Text style={[styles.backButtonText, { color: currentColors.text }]}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: currentColors.textSecondary }]}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleQuantityChange = (change: number) => {
    console.log('Quantity change:', change);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    console.log('Adding to cart:', item.name, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ ...item, quantity });
    setQuantity(1);
  };

  const handleBackPress = () => {
    console.log('Back button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: currentColors.background, borderBottomColor: currentColors.accent }]}>
        <Pressable
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          <Text style={[styles.backButtonText, { color: currentColors.text }]}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.image }} style={[styles.image, { backgroundColor: currentColors.accent }]} />
        
        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View style={styles.headerLeft}>
              <Text style={[styles.name, { color: currentColors.text }]}>{item.name}</Text>
              {item.popular && (
                <View style={[styles.popularBadge, { backgroundColor: currentColors.primary }]}>
                  <IconSymbol name="star.fill" size={14} color={currentColors.card} />
                  <Text style={[styles.popularText, { color: currentColors.card }]}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={[styles.price, { color: currentColors.primary }]}>${item.price.toFixed(2)}</Text>
          </View>

          <View style={styles.categoryContainer}>
            <IconSymbol name="tag.fill" size={16} color={currentColors.textSecondary} />
            <Text style={[styles.category, { color: currentColors.textSecondary }]}>{item.category}</Text>
          </View>

          <Text style={[styles.description, { color: currentColors.text }]}>{item.description}</Text>

          <View style={[styles.infoCard, { backgroundColor: currentColors.card }]}>
            <IconSymbol name="star.fill" size={20} color={currentColors.highlight} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Earn {Math.floor(item.price * quantity)} points with this order!
            </Text>
          </View>

          <View style={[styles.quantitySection, { backgroundColor: currentColors.card }]}>
            <Text style={[styles.quantityLabel, { color: currentColors.text }]}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Pressable
                style={[styles.quantityButton, { backgroundColor: currentColors.background }]}
                onPress={() => handleQuantityChange(-1)}
              >
                <IconSymbol name="minus" size={20} color={currentColors.primary} />
              </Pressable>
              <Text style={[styles.quantityValue, { color: currentColors.text }]}>{quantity}</Text>
              <Pressable
                style={[styles.quantityButton, { backgroundColor: currentColors.background }]}
                onPress={() => handleQuantityChange(1)}
              >
                <IconSymbol name="plus" size={20} color={currentColors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: currentColors.card, borderTopColor: currentColors.background }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: currentColors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: currentColors.text }]}>${(item.price * quantity).toFixed(2)}</Text>
        </View>
        <Pressable style={[styles.addButton, { backgroundColor: currentColors.primary }]} onPress={handleAddToCart}>
          <IconSymbol name="cart.fill" size={20} color={currentColors.card} />
          <Text style={[styles.addButtonText, { color: currentColors.card }]}>Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  category: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  quantitySection: {
    padding: 20,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
