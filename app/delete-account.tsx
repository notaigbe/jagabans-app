
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
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import Dialog from '@/components/Dialog';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, SUPABASE_URL } from './integrations/supabase/client';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { userProfile, currentColors } = useApp();
  const { user, signOut } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirm' | 'authenticate'>('warning');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (step === 'warning') {
      setStep('confirm');
    } else if (step === 'confirm') {
      if (confirmText.toLowerCase() !== 'delete my account') {
        showToast('error', 'Please type "DELETE MY ACCOUNT" to confirm');
        return;
      }
      setStep('authenticate');
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (!password) {
      showToast('error', 'Please enter your password');
      return;
    }

    if (!user?.email) {
      showToast('error', 'User not authenticated');
      return;
    }

    setDeleting(true);
    try {
      // Step 1: Re-authenticate user
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        console.error('Re-authentication error:', authError);
        showToast('error', 'Invalid password. Please try again.');
        setDeleting(false);
        return;
      }

      // Step 2: Call edge function to delete account
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'Session expired. Please try again.');
        setDeleting(false);
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Step 3: Show success message and sign out
      showDialog(
        'Account Deleted',
        'Your account has been permanently deleted. All personal data has been removed, but your order history has been anonymized and retained for business records.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
              router.replace('/(tabs)/(home)');
            },
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      console.error('Delete account error:', error);
      showToast('error', error.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderWarningStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.warningIconContainer}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.warningIconGradient}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: currentColors.text }]}>
        Delete Your Account?
      </Text>

      <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
        This action is permanent and cannot be undone.
      </Text>

      <LinearGradient
        colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.infoCard, { borderColor: currentColors.border }]}
      >
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: currentColors.text }]}>
            What will be deleted:
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FF6B6B" />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Your name, email, and phone number
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FF6B6B" />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Saved addresses and preferences
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FF6B6B" />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Authentication credentials
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FF6B6B" />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Active sessions and tokens
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FF6B6B" />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Points balance and rewards
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: currentColors.border }]} />

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: currentColors.text }]}>
            What will be retained (anonymized):
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <IconSymbol name="shield.checkmark.fill" size={20} color={currentColors.primary} />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Order history (for business records)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="shield.checkmark.fill" size={20} color={currentColors.primary} />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Payment transaction records
              </Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="shield.checkmark.fill" size={20} color={currentColors.primary} />
              <Text style={[styles.infoText, { color: currentColors.text }]}>
                Order totals and timestamps
              </Text>
            </View>
          </View>
          <Text style={[styles.infoNote, { color: currentColors.textSecondary }]}>
            * All retained data will be anonymized and cannot be linked back to you
          </Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.continueButton}
      >
        <Pressable
          style={styles.continueButtonInner}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>I Understand, Continue</Text>
        </Pressable>
      </LinearGradient>

      <Pressable
        style={styles.cancelButton}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.back();
        }}
      >
        <Text style={[styles.cancelButtonText, { color: currentColors.textSecondary }]}>
          Cancel
        </Text>
      </Pressable>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.warningIconContainer}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.warningIconGradient}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: currentColors.text }]}>
        Final Confirmation
      </Text>

      <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
        To confirm deletion, please type:
      </Text>

      <LinearGradient
        colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.confirmTextCard, { borderColor: currentColors.border }]}
      >
        <Text style={[styles.confirmTextLabel, { color: '#FF6B6B' }]}>
          DELETE MY ACCOUNT
        </Text>
      </LinearGradient>

      <TextInput
        style={[
          styles.confirmInput,
          {
            backgroundColor: currentColors.card,
            color: currentColors.text,
            borderColor: currentColors.border,
          }
        ]}
        value={confirmText}
        onChangeText={setConfirmText}
        placeholder="Type here..."
        placeholderTextColor={currentColors.textSecondary}
        autoCapitalize="characters"
      />

      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.continueButton, { opacity: confirmText.toLowerCase() === 'delete my account' ? 1 : 0.5 }]}
      >
        <Pressable
          style={styles.continueButtonInner}
          onPress={handleContinue}
          disabled={confirmText.toLowerCase() !== 'delete my account'}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </LinearGradient>

      <Pressable
        style={styles.cancelButton}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setStep('warning');
          setConfirmText('');
        }}
      >
        <Text style={[styles.cancelButtonText, { color: currentColors.textSecondary }]}>
          Go Back
        </Text>
      </Pressable>
    </View>
  );

  const renderAuthenticateStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.warningIconContainer}>
        <LinearGradient
          colors={[currentColors.primary, currentColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.warningIconGradient}
        >
          <IconSymbol name="lock.fill" size={64} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: currentColors.text }]}>
        Verify Your Identity
      </Text>

      <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
        Please enter your password to confirm account deletion
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: currentColors.text }]}>
          Email
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: currentColors.card,
              color: currentColors.textSecondary,
              borderColor: currentColors.border,
            }
          ]}
          value={user?.email || ''}
          editable={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: currentColors.text }]}>
          Password
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              {
                backgroundColor: currentColors.card,
                color: currentColors.text,
                borderColor: currentColors.border,
              }
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={currentColors.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!deleting}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => {
              setShowPassword(!showPassword);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <IconSymbol
              name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
              size={20}
              color={currentColors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.deleteButton, { opacity: deleting || !password ? 0.5 : 1 }]}
      >
        <Pressable
          style={styles.deleteButtonInner}
          onPress={handleDeleteAccount}
          disabled={deleting || !password}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <IconSymbol name="trash.fill" size={20} color="#FFF" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </>
          )}
        </Pressable>
      </LinearGradient>

      <Pressable
        style={styles.cancelButton}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setStep('confirm');
          setPassword('');
          setShowPassword(false);
        }}
        disabled={deleting}
      >
        <Text style={[styles.cancelButtonText, { color: currentColors.textSecondary }]}>
          Go Back
        </Text>
      </Pressable>
    </View>
  );

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
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
              disabled={deleting}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Delete Account</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 'warning' && renderWarningStep()}
            {step === 'confirm' && renderConfirmStep()}
            {step === 'authenticate' && renderAuthenticateStep()}
          </ScrollView>
        </View>
        
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={currentColors}
        />
        <Dialog
          visible={dialogVisible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
          onHide={() => setDialogVisible(false)}
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
  container: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 120,
  },
  stepContainer: {
    alignItems: 'center',
  },
  warningIconContainer: {
    marginBottom: 24,
  },
  warningIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.4)',
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    width: '100%',
    borderRadius: 0,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  continueButton: {
    width: '100%',
    borderRadius: 0,
    marginBottom: 16,
    boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.4)',
    elevation: 8,
  },
  continueButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  confirmTextCard: {
    width: '100%',
    borderRadius: 0,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    alignItems: 'center',
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  confirmTextLabel: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  confirmInput: {
    width: '100%',
    borderRadius: 0,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: 0,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    borderRadius: 0,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  deleteButton: {
    width: '100%',
    borderRadius: 0,
    marginTop: 12,
    marginBottom: 16,
    boxShadow: '0px 8px 24px rgba(255, 107, 107, 0.4)',
    elevation: 8,
  },
  deleteButtonInner: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFF',
  },
});
