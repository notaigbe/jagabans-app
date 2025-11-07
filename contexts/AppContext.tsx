
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { CartItem, Order, UserProfile, GiftCard, PaymentMethod, AppNotification, ThemeSettings, ThemeMode, ColorScheme } from '@/types';

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  userProfile: UserProfile;
  placeOrder: () => void;
  purchaseGiftCard: (giftCard: GiftCard) => void;
  redeemMerch: (merchId: string, pointsCost: number) => void;
  addPaymentMethod: (paymentMethod: PaymentMethod) => void;
  removePaymentMethod: (paymentMethodId: string) => void;
  setDefaultPaymentMethod: (paymentMethodId: string) => void;
  updateProfileImage: (imageUri: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  addNotification: (notification: AppNotification) => void;
  themeSettings: ThemeSettings;
  updateThemeMode: (mode: ThemeMode) => void;
  updateColorScheme: (scheme: ColorScheme) => void;
  currentColors: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorScheme: 'default',
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: 'Guest User',
    email: 'guest@jagabansla.com',
    phone: '+1 (555) 123-4567',
    points: 1250,
    orders: [],
    giftCards: [],
    paymentMethods: [],
    notifications: [
      {
        id: '1',
        title: 'Welcome to Jagabans LA!',
        message: 'Start earning points with every purchase. Check out our menu!',
        type: 'general',
        date: new Date().toISOString(),
        read: false,
      },
    ],
    rsvpEvents: [],
    themeSettings: {
      mode: 'light',
      colorScheme: 'default',
    },
  });

  // Get current colors based on theme settings
  const getCurrentColors = () => {
    const colorSchemes = {
      default: {
        light: {
          background: '#FFF3E0',
          text: '#212121',
          textSecondary: '#757575',
          primary: '#E64A19',
          secondary: '#F57C00',
          accent: '#FFB74D',
          card: '#FFFFFF',
          highlight: '#FFD54F',
        },
        dark: {
          background: '#1A1A1A',
          text: '#FFFFFF',
          textSecondary: '#B0B0B0',
          primary: '#FF6E40',
          secondary: '#FF9800',
          accent: '#FFB74D',
          card: '#2A2A2A',
          highlight: '#FFD54F',
        },
      },
      warm: {
        light: {
          background: '#FFF8E1',
          text: '#3E2723',
          textSecondary: '#6D4C41',
          primary: '#D84315',
          secondary: '#F4511E',
          accent: '#FF8A65',
          card: '#FFFFFF',
          highlight: '#FFAB91',
        },
        dark: {
          background: '#1C1410',
          text: '#FAFAFA',
          textSecondary: '#BCAAA4',
          primary: '#FF6E40',
          secondary: '#FF7043',
          accent: '#FF8A65',
          card: '#2C2018',
          highlight: '#FFAB91',
        },
      },
      cool: {
        light: {
          background: '#E3F2FD',
          text: '#0D47A1',
          textSecondary: '#1565C0',
          primary: '#1976D2',
          secondary: '#42A5F5',
          accent: '#64B5F6',
          card: '#FFFFFF',
          highlight: '#90CAF9',
        },
        dark: {
          background: '#0A1929',
          text: '#E3F2FD',
          textSecondary: '#90CAF9',
          primary: '#42A5F5',
          secondary: '#64B5F6',
          accent: '#90CAF9',
          card: '#132F4C',
          highlight: '#BBDEFB',
        },
      },
      vibrant: {
        light: {
          background: '#F3E5F5',
          text: '#4A148C',
          textSecondary: '#6A1B9A',
          primary: '#7B1FA2',
          secondary: '#AB47BC',
          accent: '#CE93D8',
          card: '#FFFFFF',
          highlight: '#E1BEE7',
        },
        dark: {
          background: '#1A0A1F',
          text: '#F3E5F5',
          textSecondary: '#CE93D8',
          primary: '#AB47BC',
          secondary: '#BA68C8',
          accent: '#CE93D8',
          card: '#2A1A2F',
          highlight: '#E1BEE7',
        },
      },
      minimal: {
        light: {
          background: '#FAFAFA',
          text: '#212121',
          textSecondary: '#757575',
          primary: '#424242',
          secondary: '#616161',
          accent: '#9E9E9E',
          card: '#FFFFFF',
          highlight: '#BDBDBD',
        },
        dark: {
          background: '#121212',
          text: '#FAFAFA',
          textSecondary: '#B0B0B0',
          primary: '#E0E0E0',
          secondary: '#BDBDBD',
          accent: '#9E9E9E',
          card: '#1E1E1E',
          highlight: '#757575',
        },
      },
    };

    const effectiveMode = themeSettings.mode === 'auto' ? (systemColorScheme || 'light') : themeSettings.mode;
    return colorSchemes[themeSettings.colorScheme][effectiveMode];
  };

  const currentColors = getCurrentColors();

  const addToCart = (item: CartItem) => {
    console.log('Adding to cart:', item.name);
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    console.log('Removing from cart:', itemId);
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    console.log('Updating cart quantity:', itemId, quantity);
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCart([]);
  };

  const placeOrder = () => {
    console.log('Placing order');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const pointsEarned = Math.floor(total);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      pointsEarned,
      date: new Date().toISOString(),
      status: 'pending',
    };

    setUserProfile((prev) => ({
      ...prev,
      points: prev.points + pointsEarned,
      orders: [newOrder, ...prev.orders],
    }));

    const orderNotification: AppNotification = {
      id: Date.now().toString(),
      title: 'Order Placed Successfully!',
      message: `Your order of $${total.toFixed(2)} has been placed. You earned ${pointsEarned} points!`,
      type: 'order',
      date: new Date().toISOString(),
      read: false,
    };

    addNotification(orderNotification);
    clearCart();
  };

  const purchaseGiftCard = (giftCard: GiftCard) => {
    console.log('Purchasing gift card:', giftCard);
    setUserProfile((prev) => ({
      ...prev,
      giftCards: [...prev.giftCards, { ...giftCard, purchaseDate: new Date().toISOString() }],
    }));
  };

  const redeemMerch = (merchId: string, pointsCost: number) => {
    console.log('Redeeming merch:', merchId, pointsCost);
    if (userProfile.points >= pointsCost) {
      setUserProfile((prev) => ({
        ...prev,
        points: prev.points - pointsCost,
      }));
    }
  };

  const addPaymentMethod = (paymentMethod: PaymentMethod) => {
    console.log('Adding payment method');
    setUserProfile((prev) => {
      const isFirstCard = prev.paymentMethods.length === 0;
      const newPaymentMethod = { ...paymentMethod, isDefault: isFirstCard };
      return {
        ...prev,
        paymentMethods: [...prev.paymentMethods, newPaymentMethod],
      };
    });
  };

  const removePaymentMethod = (paymentMethodId: string) => {
    console.log('Removing payment method:', paymentMethodId);
    setUserProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== paymentMethodId),
    }));
  };

  const setDefaultPaymentMethod = (paymentMethodId: string) => {
    console.log('Setting default payment method:', paymentMethodId);
    setUserProfile((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === paymentMethodId,
      })),
    }));
  };

  const updateProfileImage = (imageUri: string) => {
    console.log('Updating profile image');
    setUserProfile((prev) => ({
      ...prev,
      profileImage: imageUri,
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    setUserProfile((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
    }));
  };

  const addNotification = (notification: AppNotification) => {
    console.log('Adding notification:', notification.title);
    setUserProfile((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }));
  };

  const updateThemeMode = (mode: ThemeMode) => {
    console.log('Updating theme mode:', mode);
    setThemeSettings((prev) => ({ ...prev, mode }));
    setUserProfile((prev) => ({
      ...prev,
      themeSettings: { ...prev.themeSettings!, mode },
    }));
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    console.log('Updating color scheme:', scheme);
    setThemeSettings((prev) => ({ ...prev, colorScheme: scheme }));
    setUserProfile((prev) => ({
      ...prev,
      themeSettings: { ...prev.themeSettings!, colorScheme: scheme },
    }));
  };

  // Sync theme settings from user profile
  useEffect(() => {
    if (userProfile.themeSettings) {
      setThemeSettings(userProfile.themeSettings);
    }
  }, [userProfile.themeSettings]);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        userProfile,
        placeOrder,
        purchaseGiftCard,
        redeemMerch,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        updateProfileImage,
        markNotificationAsRead,
        addNotification,
        themeSettings,
        updateThemeMode,
        updateColorScheme,
        currentColors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
