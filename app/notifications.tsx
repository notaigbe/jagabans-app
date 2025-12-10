
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
import { LinearGradient } from 'expo-linear-gradient';
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
      case 'points':
        return 'gift.fill';
      case 'admin':
        return 'exclamationmark.triangle.fill';
      case 'system':
        return 'info.circle.fill';
      default:
        return 'bell.fill';
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'special':
        // Elegant purple/violet for special offers
        return {
          gradientStart: '#6B46C1',
          gradientEnd: '#9333EA',
          iconBg: '#9333EA20',
          iconColor: '#9333EA',
          borderColor: '#9333EA',
        };
      case 'event':
        // Sophisticated blue for events
        return {
          gradientStart: '#1E40AF',
          gradientEnd: '#3B82F6',
          iconBg: '#3B82F620',
          iconColor: '#3B82F6',
          borderColor: '#3B82F6',
        };
      case 'order':
        // Warm amber/gold for orders
        return {
          gradientStart: '#D97706',
          gradientEnd: '#F59E0B',
          iconBg: '#F59E0B20',
          iconColor: '#F59E0B',
          borderColor: '#F59E0B',
        };
      case 'points':
        // Elegant emerald green for points/rewards
        return {
          gradientStart: '#059669',
          gradientEnd: '#10B981',
          iconBg: '#10B98120',
          iconColor: '#10B981',
          borderColor: '#10B981',
        };
      case 'admin':
        // Sophisticated rose/red for admin notifications
        return {
          gradientStart: '#BE123C',
          gradientEnd: '#F43F5E',
          iconBg: '#F43F5E20',
          iconColor: '#F43F5E',
          borderColor: '#F43F5E',
        };
      case 'system':
        // Cool cyan for system notifications
        return {
          gradientStart: '#0891B2',
          gradientEnd: '#06B6D4',
          iconBg: '#06B6D420',
          iconColor: '#06B6D4',
          borderColor: '#06B6D4',
        };
      default:
        // Default teal
        return {
          gradientStart: '#0D9488',
          gradientEnd: '#14B8A6',
          iconBg: '#14B8A620',
          iconColor: '#14B8A6',
          borderColor: '#14B8A6',
        };
    }
  };

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
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderBottomWidth: 2,
      boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
      elevation: 8,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 0,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.3)',
      elevation: 4,
      borderWidth: 2,
      borderColor: currentColors.border,
    },
    headerTitle: {
      fontSize: 32,
      fontFamily: 'PlayfairDisplay_700Bold',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    notificationCount: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontFamily: 'PlayfairDisplay_700Bold',
      marginTop: 20,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    notificationCard: {
      borderRadius: 0,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      borderWidth: 2,
      boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
      elevation: 8,
    },
    notificationIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 0,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 2,
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
      elevation: 4,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: 'PlayfairDisplay_700Bold',
      flex: 1,
    },
    unreadBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
      marginLeft: 8,
      borderWidth: 1,
    },
    unreadBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      lineHeight: 20,
      marginBottom: 10,
    },
    notificationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notificationDate: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
    },
    notificationTypeLabel: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 0,
      borderWidth: 1,
    },
  });

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
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[
              currentColors.headerGradientStart || currentColors.card,
              currentColors.headerGradientEnd || currentColors.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <View style={styles.headerContent}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.back();
                }}
                style={styles.backButton}
              >
                <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { color: currentColors.text }]}>
                  Notifications
                </Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
            {userProfile && userProfile.notifications.length > 0 && (
              <Text style={[styles.notificationCount, { color: currentColors.textSecondary }]}>
                {userProfile.notifications.filter((n) => !n.read).length} unread
              </Text>
            )}
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!userProfile || userProfile.notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="bell" size={80} color={currentColors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: currentColors.text }]}>
                  No Notifications
                </Text>
                <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                  You&apos;ll see notifications about orders, specials, and events here
                </Text>
              </View>
            ) : (
              <>
                {userProfile?.notifications?.map((notification) => {
                  const notificationColors = getNotificationColors(notification.type);
                  return (
                    <Pressable
                      key={notification.id}
                      onPress={() =>
                        handleNotificationPress(notification.id, notification.actionUrl)
                      }
                    >
                      <LinearGradient
                        colors={[
                          currentColors.cardGradientStart || currentColors.card,
                          currentColors.cardGradientEnd || currentColors.card,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.notificationCard,
                          {
                            borderColor: notification.read
                              ? currentColors.border
                              : notificationColors.borderColor,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.notificationIconContainer,
                            {
                              backgroundColor: notificationColors.iconBg,
                              borderColor: notificationColors.iconColor,
                            },
                          ]}
                        >
                          <IconSymbol
                            name={getNotificationIcon(notification.type)}
                            size={28}
                            color={notificationColors.iconColor}
                          />
                        </View>
                        <View style={styles.notificationContent}>
                          <View style={styles.notificationHeader}>
                            <Text
                              style={[styles.notificationTitle, { color: currentColors.text }]}
                            >
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View
                                style={[
                                  styles.unreadBadge,
                                  {
                                    backgroundColor: notificationColors.iconBg,
                                    borderColor: notificationColors.iconColor,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.unreadBadgeText,
                                    { color: notificationColors.iconColor },
                                  ]}
                                >
                                  New
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.notificationMessage,
                              { color: currentColors.textSecondary },
                            ]}
                          >
                            {notification.message}
                          </Text>
                          <View style={styles.notificationFooter}>
                            <Text
                              style={[
                                styles.notificationDate,
                                { color: currentColors.textSecondary },
                              ]}
                            >
                              {new Date(notification.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                            <Text
                              style={[
                                styles.notificationTypeLabel,
                                {
                                  color: notificationColors.iconColor,
                                  borderColor: notificationColors.iconColor,
                                  backgroundColor: notificationColors.iconBg,
                                },
                              ]}
                            >
                              {notification.type}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
