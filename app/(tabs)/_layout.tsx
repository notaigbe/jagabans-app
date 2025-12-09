
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Menu',
    },
    {
      name: 'cart',
      route: '/(tabs)/cart',
      icon: 'cart.fill',
      label: 'Cart',
    },
    {
      name: 'merch',
      route: '/(tabs)/merch',
      icon: 'bag.fill',
      label: 'Merch',
    },
    // {
    //   name: 'giftcards',
    //   route: '/(tabs)/giftcards',
    //   icon: 'gift.fill',
    //   label: 'Gift Cards',
    // },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="merch" />
        {/* <Stack.Screen name="giftcards" /> */}
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
