
// Add to CheckoutContent component after line with useState declarations:

const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);

// Add useEffect to load saved cards:
useEffect(() => {
  loadSavedCards();
}, [userProfile?.id]);

const loadSavedCards = async () => {
  if (!userProfile?.id) return;
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('is_default', { ascending: false });
    
    if (error) throw error;
    setSavedCards(data || []);
    
    // Auto-select default card
    const defaultCard = data?.find(card => card.is_default);
    if (defaultCard) setSelectedSavedCard(defaultCard.stripe_payment_method_id);
  } catch (error) {
    console.error('Error loading saved cards:', error);
  }
};

// Update initializePaymentSheet function to include new payment options:
const { error } = await initializePaymentSheet({
  merchantDisplayName: 'Jagabans LA',
  customerId: customerData.customer,
  customerEphemeralKeySecret: customerData.ephemeralKey,
  paymentIntentClientSecret: customerData.paymentIntent,
  allowsDelayedPaymentMethods: false,
  defaultBillingDetails: {
    name: userProfile?.name,
    email: userProfile?.email,
  },
  applePay: {
    merchantCountryCode: 'US',
  },
  googlePay: {
    merchantCountryCode: 'US',
    testEnv: __DEV__,
  },
  returnURL: 'jagabansla://checkout',
  paymentMethodTypes: ['card', 'applePay', 'googlePay', 'cashApp'],
});

// Add UI section to render saved cards (add before payment button):
{savedCards.length > 0 && (
  <View style={styles.savedCardsSection}>
    <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
    {savedCards.map((card) => (
      <Pressable
        key={card.id}
        style={[
          styles.savedCardItem,
          selectedSavedCard === card.stripe_payment_method_id && styles.selectedCard
        ]}
        onPress={() => {
          setSelectedSavedCard(card.stripe_payment_method_id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <IconSymbol name={getCardIcon(card.card_brand)} size={24} color="#E85D2A" />
        <Text style={styles.cardText}>•••• {card.last4}</Text>
        {card.is_default && <Text style={styles.defaultBadge}>Default</Text>}
      </Pressable>
    ))}
  </View>
)}

// Add helper function:
const getCardIcon = (brand: string) => {
  switch (brand.toLowerCase()) {
    case 'visa': return 'creditcard';
    case 'mastercard': return 'creditcard';
    case 'amex': return 'creditcard';
    default: return 'creditcard';
  }
};

// Add styles:
savedCardsSection: {
  marginBottom: 20,
},
savedCardItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 15,
  backgroundColor: '#FFF',
  borderRadius: 12,
  marginBottom: 10,
  borderWidth: 2,
  borderColor: 'transparent',
},
selectedCard: {
  borderColor: '#E85D2A',
  backgroundColor: '#FFF5F2',
},
cardText: {
  fontSize: 16,
  marginLeft: 12,
  flex: 1,
},
defaultBadge: {
  fontSize: 12,
  color: '#E85D2A',
  fontWeight: '600',
},
