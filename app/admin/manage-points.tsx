
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';

export default function ManagePointsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userProfile } = useApp();
  
  const userId = params.userId as string;
  const userName = params.userName as string;
  const currentPoints = parseInt(params.currentPoints as string) || 0;

  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleAwardPoints = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      showToast('error', 'Please enter a valid positive number');
      return;
    }

    if (!reason.trim()) {
      showToast('error', 'Please provide a reason for awarding points');
      return;
    }

    showDialog(
      'Award Points',
      `Are you sure you want to award ${pointsNum} points to ${userName}?\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Award',
          onPress: async () => {
            setLoading(true);
            try {
              // Get user profile ID
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();

              if (profileError) throw profileError;

              // Update user points
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ points: currentPoints + pointsNum })
                .eq('user_id', userId);

              if (updateError) throw updateError;

              // Record transaction
              const { error: transactionError } = await supabase
                .from('points_transactions')
                .insert({
                  user_id: userId,
                  points_change: pointsNum,
                  transaction_type: 'admin_award',
                  admin_id: userProfile?.user_id,
                  reason: reason.trim(),
                });

              if (transactionError) throw transactionError;

              showToast('success', `Successfully awarded ${pointsNum} points to ${userName}`);
              
              // Reset form
              setPoints('');
              setReason('');
              
              // Go back after a short delay
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error) {
              console.error('Error awarding points:', error);
              showToast('error', 'Failed to award points. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemovePoints = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      showToast('error', 'Please enter a valid positive number');
      return;
    }

    if (pointsNum > currentPoints) {
      showToast('error', `Cannot remove more points than user has (${currentPoints})`);
      return;
    }

    if (!reason.trim()) {
      showToast('error', 'Please provide a reason for removing points');
      return;
    }

    showDialog(
      'Remove Points',
      `Are you sure you want to remove ${pointsNum} points from ${userName}?\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Get user profile ID
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();

              if (profileError) throw profileError;

              // Update user points
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ points: currentPoints - pointsNum })
                .eq('user_id', userId);

              if (updateError) throw updateError;

              // Record transaction
              const { error: transactionError } = await supabase
                .from('points_transactions')
                .insert({
                  user_id: userId,
                  points_change: -pointsNum,
                  transaction_type: 'admin_remove',
                  admin_id: userProfile?.user_id,
                  reason: reason.trim(),
                });

              if (transactionError) throw transactionError;

              showToast('success', `Successfully removed ${pointsNum} points from ${userName}`);
              
              // Reset form
              setPoints('');
              setReason('');
              
              // Go back after a short delay
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error) {
              console.error('Error removing points:', error);
              showToast('error', 'Failed to remove points. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart || colors.background, colors.gradientMid || colors.background, colors.gradientEnd || colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={[colors.headerGradientStart || colors.card, colors.headerGradientEnd || colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { borderBottomColor: colors.border }]}
        >
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.secondary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Manage Points</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.cardGradientStart || colors.card, colors.cardGradientEnd || colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.userCard, { borderColor: colors.border }]}
          >
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <View style={styles.pointsRow}>
                <IconSymbol name="star.circle.fill" size={24} color={colors.highlight} />
                <Text style={[styles.currentPoints, { color: colors.text }]}>
                  {currentPoints} points
                </Text>
              </View>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={[colors.cardGradientStart || colors.card, colors.cardGradientEnd || colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.formCard, { borderColor: colors.border }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Adjust Points
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Points Amount *
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <IconSymbol name="star.fill" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter points amount"
                  placeholderTextColor={colors.textSecondary}
                  value={points}
                  onChangeText={setPoints}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Reason *
              </Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  placeholder="Explain why you're adjusting points..."
                  placeholderTextColor={colors.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <Pressable
                  style={styles.actionButtonInner}
                  onPress={handleAwardPoints}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <>
                      <IconSymbol name="plus.circle.fill" size={20} color={colors.background} />
                      <Text style={[styles.actionButtonText, { color: colors.background }]}>
                        Award Points
                      </Text>
                    </>
                  )}
                </Pressable>
              </LinearGradient>

              <LinearGradient
                colors={['#F44336', '#D32F2F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <Pressable
                  style={styles.actionButtonInner}
                  onPress={handleRemovePoints}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <>
                      <IconSymbol name="minus.circle.fill" size={20} color={colors.background} />
                      <Text style={[styles.actionButtonText, { color: colors.background }]}>
                        Remove Points
                      </Text>
                    </>
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={[colors.cardGradientStart || colors.card, colors.cardGradientEnd || colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.infoCard, { borderColor: colors.border }]}
          >
            <IconSymbol name="info.circle.fill" size={24} color={colors.highlight} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>Award Points:</Text> Add points to the user&apos;s balance
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>Remove Points:</Text> Deduct points from the user&apos;s balance
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                All changes are logged with your admin ID and reason
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
        />
        <Dialog
          visible={dialogVisible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
          onHide={() => setDialogVisible(false)}
          currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }}
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
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 12,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPoints: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  formCard: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    marginLeft: 0,
    paddingTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    paddingVertical: 16,
    gap: 8,
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  infoCard: {
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
