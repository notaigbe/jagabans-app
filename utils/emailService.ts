
import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  deliveryAddress?: string;
  pickupNotes?: string;
  orderType: 'delivery' | 'pickup';
  timestamp: string;
}

/**
 * Send order confirmation email to predefined admin recipients
 * This is called after successful payment
 */
export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    console.log('Sending order confirmation email for order:', orderData.orderId);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session - cannot send email');
      return false;
    }

    // TODO: Backend Integration - Call the send-order-confirmation-email Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send order confirmation email:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('Order confirmation email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
};
