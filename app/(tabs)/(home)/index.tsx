
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { menuItems, menuCategories } from '@/data/menuData';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { currentColors } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const handleCategoryPress = (category: string) => {
    console.log('Category selected:', category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleItemPress = (itemId: string) => {
    console.log('Item pressed:', itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/item-detail?id=${itemId}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('@/assets/images/32297f18-8c85-4435-9bd9-0ac1fa24076e.png')}
              style={styles.logo}
            />
            <Text style={[styles.headerSubtitle, { color: currentColors.textSecondary }]}>Authentic West African Cuisine</Text>
          </View>
          <IconSymbol name="bell.fill" size={24} color={currentColors.primary} />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {menuCategories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                { backgroundColor: currentColors.card },
                selectedCategory === category && { backgroundColor: currentColors.primary },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: currentColors.text },
                  selectedCategory === category && { color: currentColors.card },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          contentContainerStyle={[
            styles.menuContent,
            Platform.OS !== 'ios' && styles.menuContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.menuItem, { backgroundColor: currentColors.card }]}
              onPress={() => handleItemPress(item.id)}
            >
              <Image source={{ uri: item.image }} style={[styles.menuItemImage, { backgroundColor: currentColors.accent }]} />
              {item.popular && (
                <View style={[styles.popularBadge, { backgroundColor: currentColors.primary }]}>
                  <IconSymbol name="star.fill" size={12} color={currentColors.card} />
                  <Text style={[styles.popularText, { color: currentColors.card }]}>Popular</Text>
                </View>
              )}
              <View style={styles.menuItemInfo}>
                <Text style={[styles.menuItemName, { color: currentColors.text }]}>{item.name}</Text>
                <Text style={[styles.menuItemDescription, { color: currentColors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.menuItemFooter}>
                  <Text style={[styles.menuItemPrice, { color: currentColors.primary }]}>${item.price.toFixed(2)}</Text>
                  <View style={[styles.addButton, { backgroundColor: currentColors.primary }]}>
                    <IconSymbol name="plus" size={20} color={currentColors.card} />
                  </View>
                </View>
              </View>
            </Pressable>
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
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 0,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  menuContentWithTabBar: {
    paddingBottom: 100,
  },
  menuItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  menuItemImage: {
    width: '100%',
    height: 200,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemInfo: {
    padding: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
