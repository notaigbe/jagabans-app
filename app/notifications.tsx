
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const router = useRouter();
  const { userProfile, markNotificationAsRead, currentColors } = useApp();

  const handleNotificationPress = (notificationId: string, actionUrl?: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markNotificationAsRead(notificationId);
    if (actionUrl) {
      router.push(actionUrl as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'special':
        return 'star.fill';
      case 'event':
        return 'calendar';
      case 'order':
        return 'bag.fill';
      default:
        return 'bell.fill';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'special':
        return currentColors.highlight;
      case 'event':
        return currentColors.accent;
      case 'order':
        return currentColors.primary;
      default:
        return currentColors.secondary;
    }
  };

  const styles = StyleSheet.create({
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
    paddingVertical: 16,
  },
  backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
  },
});

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.back();
                      }}
                      style={styles.backButton}
                    >
                      <IconSymbol name="chevron.left" size={24} color={currentColors.primary} />
                    </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!userProfile || userProfile.notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="bell" size={64} color={currentColors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>No Notifications</Text>
              <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                You&apos;ll see notifications about orders, specials, and events here
              </Text>
            </View>
          ) : (
            <>
              {userProfile?.notifications?.map((notification) => (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    { backgroundColor: currentColors.card },
                    !notification.read && { borderLeftWidth: 4, borderLeftColor: currentColors.primary },
                  ]}
                  onPress={() =>
                    handleNotificationPress(notification.id, notification.actionUrl)
                  }
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: getNotificationColor(notification.type) + '20' },
                    ]}
                  >
                    <IconSymbol
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, { color: currentColors.text }]}>{notification.title}</Text>
                      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: currentColors.primary }]} />}
                    </View>
                    <Text style={[styles.notificationMessage, { color: currentColors.textSecondary }]}>{notification.message}</Text>
                    <Text style={[styles.notificationDate, { color: currentColors.textSecondary }]}>
                      {new Date(notification.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

