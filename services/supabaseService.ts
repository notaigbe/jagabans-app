
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';
import type { Database } from '@/app/integrations/supabase/types';
import { 
  MenuItem, 
  Order, 
  CartItem, 
  GiftCard, 
  MerchItem, 
  MerchRedemption, 
  Event, 
  PaymentMethod,
  UserProfile,
  AppNotification,
  ThemeSettings
} from '@/types';

// The imported `supabase` from client.ts is already typed as SupabaseClient<Database>

// ============================================
// AUTHENTICATION SERVICES
// ============================================

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, name: string, phone?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            name,
            phone,
          }
        }
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = (await ((supabase as any)
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name,
            email,
            phone: phone || '',
            points: 0,
          }) as unknown)) as { data: Database['public']['Tables']['user_profiles']['Row'][] | null; error: any };

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Create default theme settings
        await ((supabase as any)
          .from('theme_settings')
          .insert({
            user_id: data.user.id,
            mode: 'auto',
            color_scheme: 'default',
          }) as unknown) as { data: Database['public']['Tables']['theme_settings']['Row'][] | null; error: any };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  /**
   * Get the current user session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// USER PROFILE SERVICES
// ============================================

export const userService = {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = (await ((supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single() as unknown)) as { data: Database['public']['Tables']['user_profiles']['Row'] | null; error: any };

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = (await ((supabase as any)
        .from('user_profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          profile_image: updates.profileImage,
          updated_at: new Date().toISOString(),
        }) as unknown)) as { data: Database['public']['Tables']['user_profiles']['Row'] | null; error: any };

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { data: null, error };
    }
  },

  /**
   * Add points to user account
   */
  async addPoints(userId: string, points: number) {
    try {
      const { data: profile } = (await ((supabase as any)
        .from('user_profiles')
        .select('points')
        .eq('id', userId)
        .single() as unknown)) as { data: Pick<Database['public']['Tables']['user_profiles']['Row'], 'points'> | null; error: any };

      if (!profile) throw new Error('User profile not found');

      const { data, error } = (await ((supabase as any)
        .from('user_profiles')
        .update({ points: profile.points + points }) as unknown)) as { data: Database['public']['Tables']['user_profiles']['Row'] | null; error: any };

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add points error:', error);
      return { data: null, error };
    }
  },

  /**
   * Deduct points from user account
   */
  async deductPoints(userId: string, points: number) {
    try {
      const { data: profile } = (await ((supabase as any)
        .from('user_profiles')
        .select('points')
        .eq('id', userId)
        .single() as unknown)) as { data: Pick<Database['public']['Tables']['user_profiles']['Row'], 'points'> | null; error: any };

      if (!profile) throw new Error('User profile not found');
      if (profile.points < points) throw new Error('Insufficient points');

      const { data, error } = (await ((supabase as any)
        .from('user_profiles')
        .update({ points: profile.points - points }) as unknown)) as { data: Database['public']['Tables']['user_profiles']['Row'] | null; error: any };

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Deduct points error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// MENU SERVICES
// ============================================

export const menuService = {
  /**
   * Get all menu items
   */
  async getMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get menu items error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get menu items by category
   */
  async getMenuItemsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category', category)
        .eq('available', true);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get menu items by category error:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a new menu item (Admin)
   */
  async addMenuItem(item: Omit<MenuItem, 'id'>) {
    try {
      const { data, error } = await (supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          popular: item.popular || false,
          available: true,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add menu item error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a menu item (Admin)
   */
  async updateMenuItem(itemId: string, updates: Partial<MenuItem>) {
    try {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          category: updates.category,
          image: updates.image,
          popular: updates.popular,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update menu item error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a menu item (Admin)
   */
  async deleteMenuItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete menu item error:', error);
      return { error };
    }
  },
};

// ============================================
// ORDER SERVICES
// ============================================

export const orderService = {
  /**
   * Place a new order
   */
  async placeOrder(
    userId: string,
    items: CartItem[],
    deliveryAddress?: string,
    pickupNotes?: string
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/place-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            items,
            deliveryAddress,
            pickupNotes,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      return { data: result, error: null };
    } catch (error) {
      console.error('Place order error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get order history for a user
   */
  async getOrderHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get order history error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get order error:', error);
      return { data: null, error };
    }
  },

  /**
 * Update order status (Admin)
 */
async updateOrderStatus(orderId: string, status: Order['status']) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update order status error:', error);
    return { data: null, error };
  }
},

  /**
   * Get all orders (Admin)
   */
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          user_profiles (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get all orders error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// GIFT CARD SERVICES
// ============================================

export const giftCardService = {
  /**
   * Send a gift card
   */
  async sendGiftCard(
    senderId: string,
    recipientId: string,
    recipientName: string,
    points: number,
    message?: string
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-gift-card`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipientId,
            recipientName,
            points,
            message,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      return { data: result, error: null };
    } catch (error) {
      console.error('Send gift card error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get gift cards received by a user
   */
  async getReceivedGiftCards(userId: string) {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          sender:user_profiles!gift_cards_sender_id_fkey (name, email)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get received gift cards error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get gift cards sent by a user
   */
  async getSentGiftCards(userId: string) {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          recipient:user_profiles!gift_cards_recipient_id_fkey (name, email)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get sent gift cards error:', error);
      return { data: null, error };
    }
  },

  /**
   * Redeem a gift card
   */
  async redeemGiftCard(giftCardId: string, userId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('gift_cards')
        .update({ 
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', giftCardId)
        .eq('recipient_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Redeem gift card error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// MERCH SERVICES
// ============================================

export const merchService = {
  /**
   * Get all merch items
   */
  async getMerchItems() {
    try {
      const { data, error } = await supabase
        .from('merch_items')
        .select('*')
        .eq('in_stock', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get merch items error:', error);
      return { data: null, error };
    }
  },

  /**
   * Redeem merch
   */
  async redeemMerch(
    userId: string,
    merchId: string,
    merchName: string,
    pointsCost: number,
    deliveryAddress: string,
    pickupNotes?: string
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/redeem-merch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            merchId,
            merchName,
            pointsCost,
            deliveryAddress,
            pickupNotes,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      return { data: result, error: null };
    } catch (error) {
      console.error('Redeem merch error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get merch redemptions for a user
   */
  async getMerchRedemptions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('merch_redemptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get merch redemptions error:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a new merch item (Admin)
   */
  async addMerchItem(item: Omit<MerchItem, 'id'>) {
    try {
      const { data, error } = await (supabase
        .from('merch_items')
        .insert({
          name: item.name,
          description: item.description,
          points_cost: item.pointsCost,
          image: item.image,
          in_stock: item.inStock,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add merch item error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a merch item (Admin)
   */
  async updateMerchItem(itemId: string, updates: Partial<MerchItem>) {
    try {
      const { data, error } = await (supabase as any)
        .from('merch_items')
        .update({
          name: updates.name,
          description: updates.description,
          points_cost: updates.pointsCost,
          image: updates.image,
          in_stock: updates.inStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update merch item error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a merch item (Admin)
   */
  async deleteMerchItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('merch_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete merch item error:', error);
      return { error };
    }
  },
};

// ============================================
// EVENT SERVICES
// ============================================

export const eventService = {
  /**
   * Get all public events
   */
  async getPublicEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_private', false)
        .eq('is_invite_only', false)
        .order('date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get public events error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all private events (for authenticated users)
   */
  async getPrivateEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_private', true)
        .eq('is_invite_only', false)
        .order('date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get private events error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get invite-only event by shareable link
   */
  async getInviteOnlyEvent(shareableLink: string) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('shareable_link', shareableLink)
        .eq('is_invite_only', true)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get invite-only event error:', error);
      return { data: null, error };
    }
  },

  /**
   * RSVP to an event
   */
  async rsvpEvent(userId: string, eventId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/rsvp-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ eventId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      return { data: result, error: null };
    } catch (error) {
      console.error('RSVP event error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's RSVPs
   */
  async getUserRSVPs(userId: string) {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user RSVPs error:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new event (Admin)
   */
  async createEvent(event: Omit<Event, 'id' | 'attendees'>) {
    try {
      const shareableLink = event.isInviteOnly 
        ? `invite-${Math.random().toString(36).substring(2, 15)}`
        : null;

      const { data, error } = await (supabase
        .from('events')
        .insert({
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          capacity: event.capacity,
          image: event.image,
          is_private: event.isPrivate,
          is_invite_only: event.isInviteOnly,
          shareable_link: shareableLink,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create event error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update an event (Admin)
   */
  async updateEvent(eventId: string, updates: Partial<Event>) {
    try {
      const { data, error } = await (supabase as any)
        .from('events')
        .update({
          title: updates.title,
          description: updates.description,
          date: updates.date,
          location: updates.location,
          capacity: updates.capacity,
          image: updates.image,
          is_private: updates.isPrivate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update event error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete an event (Admin)
   */
  async deleteEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete event error:', error);
      return { error };
    }
  },
};

// ============================================
// PAYMENT METHOD SERVICES
// ============================================

export const paymentMethodService = {
  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get payment methods error:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a payment method
   */
  async addPaymentMethod(userId: string, paymentMethod: Omit<PaymentMethod, 'id'>) {
    try {
      const { data, error } = await (supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: paymentMethod.type,
          card_number: paymentMethod.cardNumber,
          cardholder_name: paymentMethod.cardholderName,
          expiry_date: paymentMethod.expiryDate,
          is_default: paymentMethod.isDefault,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add payment method error:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string) {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Remove payment method error:', error);
      return { error };
    }
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    try {
      // First, unset all default payment methods
      await (supabase as any)
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the new default
      const { data, error } = await (supabase as any)
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Set default payment method error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// NOTIFICATION SERVICES
// ============================================

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a notification
   */
  async createNotification(notification: Omit<AppNotification, 'id' | 'date' | 'read'>) {
    try {
      const { data, error } = await (supabase
        .from('notifications')
        .insert({
          user_id: (notification as any).userId, 
          title: notification.title,
          message: notification.message,
          type: notification.type,
          action_url: notification.actionUrl,
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create notification error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete notification error:', error);
      return { error };
    }
  },
};

// ============================================
// THEME SETTINGS SERVICES
// ============================================

export const themeService = {
  /**
   * Get theme settings for a user
   */
  async getThemeSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get theme settings error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update theme settings
   */
  async updateThemeSettings(userId: string, settings: ThemeSettings) {
    try {
      const { data, error } = await (supabase as any)
        .from('theme_settings')
        .upsert({
          user_id: userId,
          mode: settings.mode,
          color_scheme: settings.colorScheme,
          updated_at: new Date().toISOString(),
        }, {onConflict: ['user_id']})
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update theme settings error:', error);
      return { data: null, error };
    }
  },
};

// ============================================
// IMAGE STORAGE SERVICES
// ============================================

export const imageService = {
  /**
   * Upload an image to Supabase Storage
   * @param bucket - bucket name
   * @param path - path including filename (e.g., 'avatars/user123.png')
   * @param file - File or Blob object
   */
// Updated imageService.uploadImage method:
async uploadImage(
  bucket: string, 
  path: string, 
  file: ArrayBuffer | Blob | File,
  options?: { contentType?: string; upsert?: boolean }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { 
        cacheControl: '3600', 
        upsert: options?.upsert ?? true,
        contentType: options?.contentType
      });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Upload image error:', error);
    return { data: null, error };
  }
},

  /**
   * Get public URL for a public bucket
   * @param bucket - bucket name
   * @param path - path to the file
   */
  getPublicUrl(bucket: string, path: string): string | null {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  },

  /**
   * Get signed URL for private bucket
   * @param bucket - bucket name
   * @param path - path to the file
   * @param expiresIn - expiration in seconds (default 1 hour)
   */
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Get signed URL error:', error);
      return null;
    }
  },

  /**
   * List files in a folder
   * @param bucket - bucket name
   * @param folder - folder path
   */
  async listFiles(bucket: string, folder: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  },

  /**
   * Download file as blob (for caching or offline usage)
   * @param bucket - bucket name
   * @param path - file path
   */
  async downloadFile(bucket: string, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Download file error:', error);
      return null;
    }
  },
};
