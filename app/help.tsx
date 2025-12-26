
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';

interface HelpTopic {
  id: string;
  question: string;
  answer: string;
  icon: string;
  category: string;
}

const helpTopics: HelpTopic[] = [
  {
    id: '1',
    question: 'How do I earn points?',
    answer: 'You earn 1 point for every dollar spent on orders. Points are automatically added to your account after each purchase. You can use these points for discounts on future orders or redeem exclusive merchandise.',
    icon: 'star.fill',
    category: 'Points & Rewards',
  },
  {
    id: '2',
    question: 'How do I redeem my points?',
    answer: 'You can redeem points in two ways:\n\n1. During checkout, apply points as a discount (100 points = $1 off)\n2. Visit the Merch Store to redeem exclusive items using your points',
    icon: 'gift.fill',
    category: 'Points & Rewards',
  },
  {
    id: '3',
    question: 'How do gift cards work?',
    answer: 'You can purchase gift cards and send them to other members on the app. Gift cards can be used for future purchases. To send a gift card, go to the Gift Cards section and select a recipient from your contacts.',
    icon: 'card-giftcard',
    category: 'Gift Cards',
  },
  {
    id: '4',
    question: 'How do I track my order?',
    answer: 'After placing an order, you can track its status in real-time from your Order History. You\'ll receive notifications when your order status changes. Orders typically go through: Pending → Preparing → Ready → Delivered.',
    icon: 'receipt',
    category: 'Orders',
  },
  {
    id: '5',
    question: 'Can I modify or cancel my order?',
    answer: 'Orders can be modified or cancelled within 5 minutes of placement. After that, please contact us directly. Go to Order History, select your order, and tap "Cancel Order" if available.',
    icon: 'xmark.circle.fill',
    category: 'Orders',
  },
  {
    id: '6',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover). You can save multiple payment methods in your profile for faster checkout.',
    icon: 'creditcard.fill',
    category: 'Payments',
  },
  {
    id: '7',
    question: 'How do I update my profile information?',
    answer: 'Go to your Profile tab, tap on your profile picture or name, and you can edit your personal information, including name, email, phone number, and profile picture.',
    icon: 'person.circle.fill',
    category: 'Account',
  },
  {
    id: '8',
    question: 'How do I delete my account?',
    answer: 'You can delete your account from Profile → Delete Account. This will permanently remove your personal information while preserving anonymized order history for business records. This action cannot be undone.',
    icon: 'trash.fill',
    category: 'Account',
  },
  {
    id: '9',
    question: 'Do you offer delivery?',
    answer: 'Yes! We offer delivery for orders. During checkout, enter your delivery address and we\'ll bring your order right to your door. Delivery fees may apply based on distance.',
    icon: 'local-shipping',
    category: 'Delivery',
  },
  {
    id: '10',
    question: 'What are your operating hours?',
    answer: 'Our restaurant hours vary by day. You can place orders through the app during operating hours. Check our website or contact us for current hours and holiday schedules.',
    icon: 'clock.fill',
    category: 'General',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { currentColors, showToast } = useApp();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showLocalToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const toggleTopic = (topicId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleEmail = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const email = 'info@jagabansla.com';
    const subject = 'Help Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      // const supported = await Linking.canOpenURL(url);
      // if (supported) {
        await Linking.openURL(url);
      // } else {
      //   showLocalToast('Could not open email app', 'error');
      // }
    } catch (error) {
      console.error('Error opening email:', error);
      showLocalToast('Could not open email app', 'error');
    }
  };

  const handlePhone = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const phone = '+18182106659';
    const url = `tel:${phone}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showLocalToast('Could not open phone app', 'error');
      }
    } catch (error) {
      console.error('Error opening phone:', error);
      showLocalToast('Could not open phone app', 'error');
    }
  };

  const handleWebLink = async (url: string, title: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showLocalToast(`Could not open ${title}`, 'error');
      }
    } catch (error) {
      console.error(`Error opening ${title}:`, error);
      showLocalToast(`Could not open ${title}`, 'error');
    }
  };

  const groupedTopics = helpTopics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, HelpTopic[]>);

  return (
    <LinearGradient
      colors={[
        currentColors.gradientStart || currentColors.background,
        currentColors.gradientMid || currentColors.background,
        currentColors.gradientEnd || currentColors.background,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name="chevron.left"
              size={28}
              color={currentColors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>
            Help & Support
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact Section */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactSection}
          >
            <View style={styles.contactHeader}>
              <IconSymbol
                name="questionmark.circle.fill"
                size={40}
                color={currentColors.primary}
              />
              <Text style={[styles.contactTitle, { color: currentColors.text }]}>
                Need More Help?
              </Text>
              <Text
                style={[
                  styles.contactSubtitle,
                  { color: currentColors.textSecondary },
                ]}
              >
                Get in touch with our support team
              </Text>
            </View>

            <View style={styles.contactButtons}>
              <LinearGradient
                colors={[currentColors.primary, currentColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contactButton}
              >
                <Pressable
                  style={styles.contactButtonInner}
                  onPress={handleEmail}
                >
                  <IconSymbol
                    name="envelope.fill"
                    size={24}
                    color={currentColors.card}
                  />
                  <View style={styles.contactButtonText}>
                    <Text
                      style={[
                        styles.contactButtonLabel,
                        { color: currentColors.card },
                      ]}
                    >
                      Email Us
                    </Text>
                    <Text
                      style={[
                        styles.contactButtonValue,
                        { color: currentColors.card, opacity: 0.9 },
                      ]}
                    >
                      info@jagabansla.com
                    </Text>
                  </View>
                </Pressable>
              </LinearGradient>

              <LinearGradient
                colors={[currentColors.primary, currentColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contactButton}
              >
                <Pressable
                  style={styles.contactButtonInner}
                  onPress={handlePhone}
                >
                  <IconSymbol
                    name="phone.fill"
                    size={24}
                    color={currentColors.card}
                  />
                  <View style={styles.contactButtonText}>
                    <Text
                      style={[
                        styles.contactButtonLabel,
                        { color: currentColors.card },
                      ]}
                    >
                      Call Us
                    </Text>
                    <Text
                      style={[
                        styles.contactButtonValue,
                        { color: currentColors.card, opacity: 0.9 },
                      ]}
                    >
                      +1 (818) 210-6659
                    </Text>
                  </View>
                </Pressable>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
              Frequently Asked Questions
            </Text>

            {Object.entries(groupedTopics).map(([category, topics], categoryIndex) => (
              <View key={categoryIndex} style={styles.categorySection}>
                <Text
                  style={[
                    styles.categoryTitle,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  {category}
                </Text>

                {topics.map((topic, index) => {
                  const isExpanded = expandedTopics.has(topic.id);
                  return (
                    <LinearGradient
                      key={index}
                      colors={[
                        currentColors.cardGradientStart || currentColors.card,
                        currentColors.cardGradientEnd || currentColors.card,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.topicCard}
                    >
                      <Pressable
                        style={styles.topicHeader}
                        onPress={() => toggleTopic(topic.id)}
                      >
                        <View
                          style={[
                            styles.topicIcon,
                            { backgroundColor: currentColors.primary + '20' },
                          ]}
                        >
                          <IconSymbol
                            name={topic.icon}
                            size={20}
                            color={currentColors.primary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.topicQuestion,
                            { color: currentColors.text },
                          ]}
                        >
                          {topic.question}
                        </Text>
                        <IconSymbol
                          name={isExpanded ? 'chevron.up' : 'chevron.down'}
                          size={20}
                          color={currentColors.textSecondary}
                        />
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.topicAnswer}>
                          <Text
                            style={[
                              styles.answerText,
                              { color: currentColors.textSecondary },
                            ]}
                          >
                            {topic.answer}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legal Links Section */}
          <View style={styles.legalSection}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>
              Legal Information
            </Text>

            <LinearGradient
              colors={[
                currentColors.cardGradientStart || currentColors.card,
                currentColors.cardGradientEnd || currentColors.card,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.legalCard}
            >
              <Pressable
                style={styles.legalItem}
                onPress={() =>
                  handleWebLink(
                    'https://jagabansla.com/terms',
                    'Terms and Conditions'
                  )
                }
              >
                <View
                  style={[
                    styles.legalIcon,
                    { backgroundColor: currentColors.primary + '20' },
                  ]}
                >
                  <IconSymbol
                    name="doc.text.fill"
                    size={24}
                    color={currentColors.primary}
                  />
                </View>
                <View style={styles.legalContent}>
                  <Text
                    style={[styles.legalTitle, { color: currentColors.text }]}
                  >
                    Terms and Conditions
                  </Text>
                  <Text
                    style={[
                      styles.legalSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    Read our terms of service
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={currentColors.textSecondary}
                />
              </Pressable>

              <View
                style={[
                  styles.legalDivider,
                  { backgroundColor: currentColors.border },
                ]}
              />

              <Pressable
                style={styles.legalItem}
                onPress={() =>
                  handleWebLink(
                    'https://jagabansla.com/privacy',
                    'Privacy Policy'
                  )
                }
              >
                <View
                  style={[
                    styles.legalIcon,
                    { backgroundColor: currentColors.primary + '20' },
                  ]}
                >
                  <IconSymbol
                    name="lock.fill"
                    size={24}
                    color={currentColors.primary}
                  />
                </View>
                <View style={styles.legalContent}>
                  <Text
                    style={[styles.legalTitle, { color: currentColors.text }]}
                  >
                    Privacy Policy
                  </Text>
                  <Text
                    style={[
                      styles.legalSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    Learn how we protect your data
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text
              style={[styles.appInfoText, { color: currentColors.textSecondary }]}
            >
              Jagabans LA
            </Text>
            <Text
              style={[styles.appInfoText, { color: currentColors.textSecondary }]}
            >
              Version 1.2.1
            </Text>
          </View>
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={currentColors}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  contactSection: {
    borderRadius: 0,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  contactButtons: {
    gap: 12,
  },
  contactButton: {
    borderRadius: 0,
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.4)',
    elevation: 6,
  },
  contactButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  contactButtonText: {
    flex: 1,
  },
  contactButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactButtonValue: {
    fontSize: 14,
  },
  faqSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  topicCard: {
    borderRadius: 0,
    marginBottom: 12,
    overflow: 'hidden',
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  topicAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  legalSection: {
    marginBottom: 24,
  },
  legalCard: {
    borderRadius: 0,
    overflow: 'hidden',
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  legalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalContent: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  legalSubtitle: {
    fontSize: 13,
  },
  legalDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
  },
});
