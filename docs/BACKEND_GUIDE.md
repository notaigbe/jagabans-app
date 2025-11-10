
# Jagabans LA Backend Guide

This guide explains how to use the Supabase backend functions for the Jagabans LA food ordering app.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Authentication](#authentication)
4. [Services](#services)
5. [Edge Functions](#edge-functions)
6. [Usage Examples](#usage-examples)

## Overview

The backend is built using Supabase and includes:

- **PostgreSQL Database** with Row Level Security (RLS) policies
- **Edge Functions** for complex operations
- **Service Layer** for easy frontend integration
- **Real-time subscriptions** (optional)

## Database Schema

### Tables

#### user_profiles
Stores user information and points balance.

```sql
- id (uuid, primary key, references auth.users)
- name (text)
- email (text)
- phone (text, nullable)
- points (integer, default 0)
- profile_image (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### menu_items
Stores restaurant menu items.

```sql
- id (uuid, primary key)
- name (text)
- description (text)
- price (numeric)
- category (text)
- image (text)
- popular (boolean)
- available (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### orders
Stores customer orders.

```sql
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- total (numeric)
- points_earned (integer)
- status (text: pending, preparing, ready, completed, cancelled)
- delivery_address (text, nullable)
- pickup_notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### order_items
Stores individual items in an order.

```sql
- id (uuid, primary key)
- order_id (uuid, references orders)
- menu_item_id (uuid, references menu_items, nullable)
- name (text)
- price (numeric)
- quantity (integer)
- created_at (timestamp)
```

#### gift_cards
Stores gift card transactions.

```sql
- id (uuid, primary key)
- sender_id (uuid, references user_profiles)
- recipient_id (uuid, references user_profiles, nullable)
- recipient_email (text, nullable)
- recipient_name (text, nullable)
- points (integer)
- message (text, nullable)
- status (text: pending, sent, redeemed, expired)
- redeemed_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### merch_items
Stores merchandise available for redemption.

```sql
- id (uuid, primary key)
- name (text)
- description (text)
- points_cost (integer)
- image (text)
- in_stock (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### merch_redemptions
Stores merchandise redemption transactions.

```sql
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- merch_item_id (uuid, references merch_items, nullable)
- merch_name (text)
- points_cost (integer)
- delivery_address (text, nullable)
- pickup_notes (text, nullable)
- status (text: pending, processing, shipped, delivered, cancelled)
- created_at (timestamp)
- updated_at (timestamp)
```

#### events
Stores event information.

```sql
- id (uuid, primary key)
- title (text)
- description (text)
- date (timestamp)
- location (text)
- capacity (integer)
- image (text)
- is_private (boolean)
- is_invite_only (boolean)
- shareable_link (text, nullable, unique)
- created_at (timestamp)
- updated_at (timestamp)
```

#### event_rsvps
Stores event RSVPs.

```sql
- id (uuid, primary key)
- event_id (uuid, references events)
- user_id (uuid, references user_profiles)
- created_at (timestamp)
- unique(event_id, user_id)
```

#### payment_methods
Stores user payment methods.

```sql
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- type (text: credit, debit)
- card_number (text)
- cardholder_name (text)
- expiry_date (text)
- is_default (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### notifications
Stores user notifications.

```sql
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- title (text)
- message (text)
- type (text: special, event, order, general, giftcard)
- read (boolean)
- action_url (text, nullable)
- created_at (timestamp)
```

#### theme_settings
Stores user theme preferences.

```sql
- id (uuid, primary key)
- user_id (uuid, references user_profiles, unique)
- mode (text: light, dark, auto)
- color_scheme (text: default, warm, cool, vibrant, minimal)
- created_at (timestamp)
- updated_at (timestamp)
```

## Authentication

### Sign Up

```typescript
import { authService } from '@/services/supabaseService';

const { data, error } = await authService.signUp(
  'user@example.com',
  'password123',
  'John Doe',
  '+1234567890'
);

if (error) {
  console.error('Sign up error:', error);
  // Show error to user
} else {
  // Show success message
  // Remind user to verify email
}
```

### Sign In

```typescript
import { authService } from '@/services/supabaseService';

const { data, error } = await authService.signIn(
  'user@example.com',
  'password123'
);

if (error) {
  console.error('Sign in error:', error);
  // Show error to user
} else {
  // Navigate to home screen
}
```

### Sign Out

```typescript
import { authService } from '@/services/supabaseService';

const { error } = await authService.signOut();

if (error) {
  console.error('Sign out error:', error);
} else {
  // Navigate to login screen
}
```

## Services

### User Service

```typescript
import { userService } from '@/services/supabaseService';

// Get user profile
const { data: profile, error } = await userService.getUserProfile(userId);

// Update user profile
const { data, error } = await userService.updateUserProfile(userId, {
  name: 'New Name',
  phone: '+1234567890',
  profileImage: 'https://...',
});

// Add points
const { data, error } = await userService.addPoints(userId, 100);

// Deduct points
const { data, error } = await userService.deductPoints(userId, 50);
```

### Menu Service

```typescript
import { menuService } from '@/services/supabaseService';

// Get all menu items
const { data: items, error } = await menuService.getMenuItems();

// Get menu items by category
const { data: items, error } = await menuService.getMenuItemsByCategory('Main Dishes');

// Add menu item (Admin)
const { data, error } = await menuService.addMenuItem({
  name: 'Jollof Rice',
  description: 'Traditional Nigerian rice dish',
  price: 15.99,
  category: 'Main Dishes',
  image: 'https://...',
  popular: true,
});

// Update menu item (Admin)
const { data, error } = await menuService.updateMenuItem(itemId, {
  price: 17.99,
  popular: false,
});

// Delete menu item (Admin)
const { error } = await menuService.deleteMenuItem(itemId);
```

### Order Service

```typescript
import { orderService } from '@/services/supabaseService';

// Place an order
const { data, error } = await orderService.placeOrder(
  userId,
  cartItems,
  '123 Main St, Los Angeles, CA',
  'Please call when you arrive'
);

// Get order history
const { data: orders, error } = await orderService.getOrderHistory(userId);

// Get specific order
const { data: order, error } = await orderService.getOrder(orderId);

// Update order status (Admin)
const { data, error } = await orderService.updateOrderStatus(orderId, 'preparing');

// Get all orders (Admin)
const { data: orders, error } = await orderService.getAllOrders();
```

### Gift Card Service

```typescript
import { giftCardService } from '@/services/supabaseService';

// Send gift card
const { data, error } = await giftCardService.sendGiftCard(
  senderId,
  recipientId,
  'Jane Doe',
  500,
  'Happy Birthday!'
);

// Get received gift cards
const { data: giftCards, error } = await giftCardService.getReceivedGiftCards(userId);

// Get sent gift cards
const { data: giftCards, error } = await giftCardService.getSentGiftCards(userId);

// Redeem gift card
const { data, error } = await giftCardService.redeemGiftCard(giftCardId, userId);
```

### Merch Service

```typescript
import { merchService } from '@/services/supabaseService';

// Get all merch items
const { data: items, error } = await merchService.getMerchItems();

// Redeem merch
const { data, error } = await merchService.redeemMerch(
  userId,
  merchId,
  'Jagabans T-Shirt',
  500,
  '123 Main St, Los Angeles, CA',
  'Leave at door'
);

// Get merch redemptions
const { data: redemptions, error } = await merchService.getMerchRedemptions(userId);

// Add merch item (Admin)
const { data, error } = await merchService.addMerchItem({
  name: 'Jagabans T-Shirt',
  description: 'Official Jagabans LA t-shirt',
  pointsCost: 500,
  image: 'https://...',
  inStock: true,
});
```

### Event Service

```typescript
import { eventService } from '@/services/supabaseService';

// Get public events
const { data: events, error } = await eventService.getPublicEvents();

// Get private events
const { data: events, error } = await eventService.getPrivateEvents();

// Get invite-only event
const { data: event, error } = await eventService.getInviteOnlyEvent('invite-abc123');

// RSVP to event
const { data, error } = await eventService.rsvpEvent(userId, eventId);

// Get user RSVPs
const { data: rsvps, error } = await eventService.getUserRSVPs(userId);

// Create event (Admin)
const { data, error } = await eventService.createEvent({
  title: 'Nigerian Food Festival',
  description: 'Join us for an evening of authentic Nigerian cuisine',
  date: '2024-06-15T18:00:00Z',
  location: 'Jagabans LA Restaurant',
  capacity: 50,
  image: 'https://...',
  isPrivate: false,
  isInviteOnly: false,
});
```

### Payment Method Service

```typescript
import { paymentMethodService } from '@/services/supabaseService';

// Get payment methods
const { data: methods, error } = await paymentMethodService.getPaymentMethods(userId);

// Add payment method
const { data, error } = await paymentMethodService.addPaymentMethod(userId, {
  type: 'credit',
  cardNumber: '**** **** **** 1234',
  cardholderName: 'John Doe',
  expiryDate: '12/25',
  isDefault: true,
});

// Remove payment method
const { error } = await paymentMethodService.removePaymentMethod(paymentMethodId);

// Set default payment method
const { data, error } = await paymentMethodService.setDefaultPaymentMethod(userId, paymentMethodId);
```

### Notification Service

```typescript
import { notificationService } from '@/services/supabaseService';

// Get notifications
const { data: notifications, error } = await notificationService.getNotifications(userId);

// Mark as read
const { data, error } = await notificationService.markAsRead(notificationId);

// Delete notification
const { error } = await notificationService.deleteNotification(notificationId);
```

### Theme Service

```typescript
import { themeService } from '@/services/supabaseService';

// Get theme settings
const { data: settings, error } = await themeService.getThemeSettings(userId);

// Update theme settings
const { data, error } = await themeService.updateThemeSettings(userId, {
  mode: 'dark',
  colorScheme: 'vibrant',
});
```

## Edge Functions

### place-order

Places a new order and awards points to the user.

**Endpoint:** `/functions/v1/place-order`

**Request:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Jollof Rice",
      "price": 15.99,
      "quantity": 2
    }
  ],
  "deliveryAddress": "123 Main St, Los Angeles, CA",
  "pickupNotes": "Please call when you arrive"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "total": 31.98,
    "points_earned": 31,
    "status": "pending"
  },
  "pointsEarned": 31
}
```

### send-gift-card

Sends a gift card to another user.

**Endpoint:** `/functions/v1/send-gift-card`

**Request:**
```json
{
  "recipientId": "uuid",
  "recipientName": "Jane Doe",
  "points": 500,
  "message": "Happy Birthday!"
}
```

**Response:**
```json
{
  "success": true,
  "giftCard": {
    "id": "uuid",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "points": 500,
    "status": "sent"
  }
}
```

### redeem-merch

Redeems merchandise using points.

**Endpoint:** `/functions/v1/redeem-merch`

**Request:**
```json
{
  "merchId": "uuid",
  "merchName": "Jagabans T-Shirt",
  "pointsCost": 500,
  "deliveryAddress": "123 Main St, Los Angeles, CA",
  "pickupNotes": "Leave at door"
}
```

**Response:**
```json
{
  "success": true,
  "redemption": {
    "id": "uuid",
    "user_id": "uuid",
    "merch_name": "Jagabans T-Shirt",
    "points_cost": 500,
    "status": "pending"
  }
}
```

### rsvp-event

RSVPs to an event.

**Endpoint:** `/functions/v1/rsvp-event`

**Request:**
```json
{
  "eventId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rsvp": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid"
  }
}
```

## Usage Examples

### Complete Order Flow

```typescript
import { orderService, userService } from '@/services/supabaseService';

async function completeOrder(userId: string, cartItems: CartItem[]) {
  try {
    // Place the order
    const { data: orderResult, error: orderError } = await orderService.placeOrder(
      userId,
      cartItems,
      undefined, // No delivery address (pickup)
      'Please have it ready by 6 PM'
    );

    if (orderError) {
      throw orderError;
    }

    // Get updated user profile with new points
    const { data: profile, error: profileError } = await userService.getUserProfile(userId);

    if (profileError) {
      throw profileError;
    }

    console.log(`Order placed! You earned ${orderResult.pointsEarned} points.`);
    console.log(`Your new balance: ${profile.points} points`);

    return { success: true, order: orderResult.order };
  } catch (error) {
    console.error('Order error:', error);
    return { success: false, error };
  }
}
```

### Complete Gift Card Flow

```typescript
import { giftCardService, userService } from '@/services/supabaseService';

async function sendGiftCardToFriend(
  senderId: string,
  recipientId: string,
  points: number
) {
  try {
    // Check sender has enough points
    const { data: senderProfile } = await userService.getUserProfile(senderId);
    
    if (!senderProfile || senderProfile.points < points) {
      throw new Error('Insufficient points');
    }

    // Send gift card
    const { data, error } = await giftCardService.sendGiftCard(
      senderId,
      recipientId,
      'Friend Name',
      points,
      'Enjoy some delicious Nigerian food on me!'
    );

    if (error) {
      throw error;
    }

    console.log('Gift card sent successfully!');
    return { success: true };
  } catch (error) {
    console.error('Gift card error:', error);
    return { success: false, error };
  }
}
```

### Complete Merch Redemption Flow

```typescript
import { merchService, userService } from '@/services/supabaseService';

async function redeemMerchItem(
  userId: string,
  merchId: string,
  merchName: string,
  pointsCost: number
) {
  try {
    // Check user has enough points
    const { data: profile } = await userService.getUserProfile(userId);
    
    if (!profile || profile.points < pointsCost) {
      throw new Error('Insufficient points');
    }

    // Redeem merch
    const { data, error } = await merchService.redeemMerch(
      userId,
      merchId,
      merchName,
      pointsCost,
      '123 Main St, Los Angeles, CA',
      'Please call before delivery'
    );

    if (error) {
      throw error;
    }

    console.log('Merch redeemed successfully!');
    return { success: true, redemption: data.redemption };
  } catch (error) {
    console.error('Merch redemption error:', error);
    return { success: false, error };
  }
}
```

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Users can only access their own data
3. Admin operations require authentication
4. Edge Functions validate user authentication
5. Points transactions are atomic (rollback on failure)
6. Card numbers should be encrypted in production

## Next Steps

1. Integrate authentication into your app
2. Replace mock data with real Supabase queries
3. Add real-time subscriptions for order updates
4. Implement admin dashboard with proper authentication
5. Add payment processing integration
6. Set up email notifications for orders and gift cards

## Support

For issues or questions, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
