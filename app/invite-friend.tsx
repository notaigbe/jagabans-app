
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService } from '@/services/socialService';
import * as Haptics from 'expo-haptics';

export default function InviteFriendScreen() {
  const router = useRouter();
  const { currentColors, userProfile, showToast } = useApp();
  const { isAuthenticated } = useAuth();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  const loadReferralCode = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await socialService.getUserReferralCode();
      if (error) {
        console.error('Error loading referral code:', error);
        showToast('Failed to load referral code', 'error');
      } else {
        setReferralCode(data);
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
      showToast('An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReferralCode();
      loadReferrals();
    }
  }, [isAuthenticated, loadReferralCode]);

  const loadReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const { data, error } = await socialService.getUserReferrals();
      if (error) {
        console.error('Error loading referrals:', error);
      } else {
        setReferrals(data || []);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleCopyCode = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (referralCode) {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(referralCode);
      } else {
        Clipboard.setString(referralCode);
      }
      showToast('Referral code copied to clipboard!', 'success');
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!referralCode) return;

    const message = `Join me on Jagabans L.A. and earn rewards! Use my referral code: ${referralCode}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Join Jagabans L.A.',
            text: message,
          });
        } else {
          // Fallback for web browsers that don't support share
          navigator.clipboard.writeText(message);
          showToast('Referral message copied to clipboard!', 'success');
        }
      } else {
        await Share.share({
          message,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed_first_order':
        return '#4CAF50';
      case 'signed_up':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed_first_order':
        return 'Completed';
      case 'signed_up':
        return 'Signed Up';
      default:
        return 'Pending';
    }
  };

  if (!isAuthenticated) {
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
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
              style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>
              Invite a Friend
            </Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <View style={styles.notAuthContainer}>
            <IconSymbol name="person.2" size={80} color={currentColors.textSecondary} />
            <Text style={[styles.notAuthText, { color: currentColors.text }]}>
              Sign in to invite friends
            </Text>
            <Text style={[styles.notAuthSubtext, { color: currentColors.textSecondary }]}>
              Create an account to get your referral code and start earning rewards
            </Text>
            <LinearGradient
              colors={[currentColors.secondary, currentColors.highlight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInButton}
            >
              <Pressable
                style={styles.signInButtonInner}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  router.push('/(tabs)/profile');
                }}
              >
                <Text style={[styles.signInButtonText, { color: currentColors.background }]}>
                  Sign In
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
        {/* Header with Gradient - matching Events screen */}
        <LinearGradient
          colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { borderBottomColor: currentColors.border }]}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
          >
            <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>
            Invite a Friend
          </Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral Code Card */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.codeCard, { borderColor: currentColors.border }]}
          >
            <View style={styles.codeHeader}>
              <IconSymbol name="gift.fill" size={48} color={currentColors.highlight} />
              <Text style={[styles.codeTitle, { color: currentColors.text }]}>
                Your Referral Code
              </Text>
              <Text style={[styles.codeSubtitle, { color: currentColors.textSecondary }]}>
                Share this code with friends to earn rewards
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.secondary} />
              </View>
            ) : (
              <>
                <View style={[styles.codeDisplay, { backgroundColor: currentColors.secondary + '20', borderColor: currentColors.border }]}>
                  <Text style={[styles.codeText, { color: currentColors.secondary }]}>
                    {referralCode}
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <LinearGradient
                    colors={[currentColors.secondary, currentColors.highlight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Pressable style={styles.actionButtonInner} onPress={handleCopyCode}>
                      <IconSymbol name="doc.on.doc" size={20} color={currentColors.background} />
                      <Text style={[styles.actionButtonText, { color: currentColors.background }]}>
                        Copy Code
                      </Text>
                    </Pressable>
                  </LinearGradient>

                  <LinearGradient
                    colors={[currentColors.secondary, currentColors.highlight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                  >
                    <Pressable style={styles.actionButtonInner} onPress={handleShare}>
                      <IconSymbol name="square.and.arrow.up" size={20} color={currentColors.background} />
                      <Text style={[styles.actionButtonText, { color: currentColors.background }]}>
                        Share
                      </Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </>
            )}
          </LinearGradient>

          {/* How It Works */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.infoCard, { borderColor: currentColors.border }]}
          >
            <Text style={[styles.infoTitle, { color: currentColors.text }]}>
              How It Works
            </Text>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.secondary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.background }]}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Share Your Code
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  Send your referral code to friends via text, email, or social media
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.secondary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.background }]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Friend Signs Up
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  Your friend creates an account using your referral code
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: currentColors.secondary }]}>
                <Text style={[styles.stepNumberText, { color: currentColors.background }]}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: currentColors.text }]}>
                  Earn Rewards
                </Text>
                <Text style={[styles.stepDescription, { color: currentColors.textSecondary }]}>
                  You both get 500 points ($5) when they sign up! Additional rewards when they complete their first order.
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Referral Stats */}
          <LinearGradient
            colors={[
              currentColors.cardGradientStart || currentColors.card,
              currentColors.cardGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statsCard, { borderColor: currentColors.border }]}
          >
            <Text style={[styles.statsTitle, { color: currentColors.text }]}>
              Your Referrals
            </Text>

            {loadingReferrals ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.secondary} />
              </View>
            ) : referrals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.2" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
                  No referrals yet
                </Text>
                <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
                  Start inviting friends to earn rewards!
                </Text>
              </View>
            ) : (
              <View style={styles.referralsList}>
                {referrals.map((referral, index) => (
                  <View key={index} style={[styles.referralItem, { borderBottomColor: currentColors.border }]}>
                    <View style={styles.referralInfo}>
                      <Text style={[styles.referralEmail, { color: currentColors.text }]}>
                        {referral.referred_user?.name || referral.referred_email || 'Pending'}
                      </Text>
                      <Text style={[styles.referralDate, { color: currentColors.textSecondary }]}>
                        {new Date(referral.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.referralStatus,
                        { backgroundColor: getStatusColor(referral.status) },
                      ]}
                    >
                      <Text style={styles.referralStatusText}>
                        {getStatusText(referral.status)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 2,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAuthText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 24,
    textAlign: 'center',
  },
  notAuthSubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 0,
    marginTop: 32,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  signInButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  signInButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  codeCard: {
    borderRadius: 0,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  codeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  codeTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginTop: 16,
  },
  codeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  codeDisplay: {
    padding: 20,
    borderRadius: 0,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  codeText: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  infoCard: {
    borderRadius: 0,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  statsCard: {
    borderRadius: 0,
    padding: 24,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  referralInfo: {
    flex: 1,
  },
  referralEmail: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  referralStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0,
  },
  referralStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
