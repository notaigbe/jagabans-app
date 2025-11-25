
import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="users" />
      <Stack.Screen name="events" />
      <Stack.Screen name="merch" />
      <Stack.Screen name="giftcards" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="reservations" />
    </Stack>
  );
}
