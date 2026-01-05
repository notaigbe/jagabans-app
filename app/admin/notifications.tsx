
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { notificationService } from '@/services/supabaseService';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';

export default function AdminNotifications() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<'special' | 'event' | 'general'>('general');
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [targetAudience, setTargetAudience] = useState<'all' | 'recent' | 'vip'>('all');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const notificationTypes = [
    { value: 'general' as const, label: 'General', icon: 'notifications' as const, color: colors.primary },
    { value: 'special' as const, label: 'Special Offer', icon: 'local-offer' as const, color: '#FF6B35' },
    { value: 'event' as const, label: 'Event', icon: 'event' as const, color: '#4ECDC4' },
  ];

  const getTargetedUsers = async () => {
    try {
      let query = supabase.from('user_profiles').select('id');
      
      if (targetAudience === 'recent') {
        // Users who placed orders in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentOrderUsers } = await supabase
          .from('orders')
          .select('user_id')
          .gte('created_at', thirtyDaysAgo.toISOString());
        
        const userIds = [...new Set((recentOrderUsers || []).map(o => o.user_id))];
        return userIds;
      } else if (targetAudience === 'vip') {
        // Users with more than 500 points
        const { data } = await query.gte('points', 500);
        return (data || []).map(u => u.id);
      }
      
      // All users
      const { data } = await query;
      return (data || []).map(u => u.id);
    } catch (err) {
      console.error('Failed to get targeted users', err);
      return allUsers;
    }
  };

  const loadRecentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('title, message, type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentNotifications(data || []);
    } catch (err) {
      console.error('Failed to load recent notifications', err);
    }
  };

  const handleSendNotification = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!title || !message) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    if (allUsers.length === 0) {
      showToast('error', 'No users found to send notifications to');
      return;
    }

    showDialog(
      'Send Notification',
      `Send "${title}" to ${allUsers.length} user(s)?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSending(true);
              
              const targetedUserIds = await getTargetedUsers();

              const notifications = targetedUserIds.map((userId) => ({
                user_id: userId,
                title: title,
                message: message,
                type: selectedType,
                read: false,
              }));

              // Batch insert notifications
              const { error } = await supabase
                .from('notifications')
                .insert(notifications as any);

              if (error) throw error;

              showToast('success', `Notification sent to ${allUsers.length} user(s)!`);
              
              // Reset form
              setTitle('');
              setMessage('');
              setSelectedType('general');
              loadRecentNotifications();
            } catch (err) {
              console.error('Failed to send notifications', err);
              showToast('error', 'Failed to send notifications. Please try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    loadUsers();
    loadRecentNotifications();
  }, []);

  const loadUsers = async () => {
    try {
      // Fetch all user profiles to get their IDs
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id');
      
      if (error) throw error;
      
      const userIds = (data || []).map((u: any) => u.id);
      setAllUsers(userIds);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Send Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Notification Type</Text>
          <View style={styles.typeSelector}>
            {notificationTypes.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardActive,
                  { borderColor: type.color },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedType(type.value);
                }}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <IconSymbol name={type.icon} size={24} color={type.color} />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && { color: type.color },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.userCountCard}>
            <IconSymbol name="person.2" size={24} color={colors.primary} />
            <View style={styles.userCountContent}>
              <Text style={styles.userCountNumber}>{allUsers.length}</Text>
              <Text style={styles.userCountLabel}>Active Users</Text>
            </View>
          </View>
          {recentNotifications.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              {recentNotifications.map((notif, index) => (
                <View key={index} style={styles.historyItem}>
                  <IconSymbol 
                    name={notificationTypes.find(t => t.value === notif.type)?.icon || 'notifications'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{notif.title}</Text>
                    <Text style={styles.historyMessage} numberOfLines={1}>
                      {notif.message}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.sectionTitle}>Notification Content</Text>
          <TextInput
            style={styles.input}
            placeholder="Notification Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notification Message"
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <IconSymbol
                  name={notificationTypes.find((t) => t.value === selectedType)?.icon || 'notifications'}
                  size={24}
                  color={notificationTypes.find((t) => t.value === selectedType)?.color || colors.primary}
                />
                <Text style={styles.previewAppName}>Jagabans LA</Text>
              </View>
              <Text style={styles.previewNotificationTitle}>
                {title || 'Notification Title'}
              </Text>
              <Text style={styles.previewNotificationMessage}>
                {message || 'Notification message will appear here...'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.sendButton, 
              (!title || !message || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendNotification}
            disabled={!title || !message || sending}
          >
            {sending ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>
                  Send to {allUsers.length} User{allUsers.length !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.infoContainer}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Push Notifications</Text>
            <Text style={styles.infoText}>
              Notifications will be sent to all users who have the mobile app installed and have enabled push notifications.
            </Text>
            <Text style={styles.infoText}>
              💡 Enable Supabase to send real-time push notifications to your users.
            </Text>
          </View>
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeCardActive: {
    borderWidth: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  previewContainer: {
    marginVertical: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewAppName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  previewNotificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  userCountCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCountContent: {
    flex: 1,
  },
  userCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userCountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
