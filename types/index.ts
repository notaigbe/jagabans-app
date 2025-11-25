
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
  serial?: string;
  available?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  pointsEarned: number;
  date: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  deliveryAddress?: string;
  pickupNotes?: string;
}

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  inStock: boolean;
}

export interface MerchRedemption {
  id: string;
  merchId: string;
  merchName: string;
  pointsCost: number;
  deliveryAddress: string;
  pickupNotes?: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

export interface GiftCard {
  id: string;
  amount?: number;
  points?: number;
  recipientEmail?: string;
  recipientName?: string;
  recipientId?: string;
  message?: string;
  purchaseDate?: string;
  senderId?: string;
  type?: 'money' | 'points';
}

export interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  isDefault: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'special' | 'event' | 'order' | 'general' | 'giftcard';
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  attendees: string[];
  image: string;
  isPrivate: boolean;
  isInviteOnly?: boolean;
  shareableLink?: string;
}

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  tableNumber?: string;
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'default' | 'warm' | 'cool' | 'vibrant' | 'minimal';

export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  orders: Order[];
  giftCards: GiftCard[];
  paymentMethods: PaymentMethod[];
  profileImage?: string;
  notifications: AppNotification[];
  rsvpEvents: string[];
  themeSettings?: ThemeSettings;
  merchRedemptions?: MerchRedemption[];
  isAdmin?: boolean;
}
