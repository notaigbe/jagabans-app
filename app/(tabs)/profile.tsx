
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { userProfile, updateProfileImage, currentColors } = useApp();
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        updateProfileImage(result.assets[0].uri);
        setImageLoading(false);
        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile image. Please try again.');
      setImageLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        updateProfileImage(result.assets[0].uri);
        setImageLoading(false);
        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setImageLoading(false);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      handleImagePick();
      return;
    }

    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleImagePick,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const unreadNotifications = userProfile.notifications.filter(n => !n.read).length;

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentColors.background,
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
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: currentColors.accent,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: currentColors.card,
      fontSize: 10,
      fontWeight: 'bold',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    scrollContentWithTabBar: {
      paddingBottom: 100,
    },
    profileCard: {
      backgroundColor: currentColors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    avatarContainer: {
      marginBottom: 12,
      position: 'relative',
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: currentColors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: currentColors.card,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentColors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: currentColors.textSecondary,
      marginBottom: 2,
    },
    profilePhone: {
      fontSize: 16,
      color: currentColors.textSecondary,
    },
    pointsCard: {
      backgroundColor: currentColors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    pointsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 12,
    },
    pointsInfo: {
      flex: 1,
    },
    pointsLabel: {
      fontSize: 14,
      color: currentColors.textSecondary,
    },
    pointsValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: currentColors.primary,
    },
    pointsSubtext: {
      fontSize: 14,
      color: currentColors.textSecondary,
      lineHeight: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentColors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 14,
      color: currentColors.textSecondary,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    seeAllText: {
      fontSize: 14,
      color: currentColors.primary,
      fontWeight: '600',
    },
    emptyState: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 40,
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    emptyStateText: {
      fontSize: 16,
      color: currentColors.textSecondary,
      marginTop: 12,
    },
    orderCard: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderDate: {
      fontSize: 14,
      color: currentColors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statuspending: {
      backgroundColor: currentColors.highlight,
    },
    statuspreparing: {
      backgroundColor: currentColors.secondary,
    },
    statusready: {
      backgroundColor: currentColors.accent,
    },
    statuscompleted: {
      backgroundColor: currentColors.primary,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: currentColors.card,
      textTransform: 'capitalize',
    },
    orderItems: {
      fontSize: 14,
      color: currentColors.textSecondary,
      marginBottom: 8,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderTotal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentColors.text,
    },
    orderPoints: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    orderPointsText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentColors.text,
    },
    actionButton: {
      backgroundColor: currentColors.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
    actionButtonText: {
      flex: 1,
      fontSize: 16,
      color: currentColors.text,
      marginLeft: 12,
    },
    actionBadge: {
      backgroundColor: currentColors.accent,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginRight: 8,
    },
    actionBadgeText: {
      color: currentColors.card,
      fontSize: 11,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/notifications');
            }}
          >
            <View>
              <IconSymbol name="bell.fill" size={24} color={currentColors.primary} />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Info */}
          <View style={styles.profileCard}>
            <Pressable 
              style={styles.avatarContainer}
              onPress={showImageOptions}
            >
              {userProfile.profileImage ? (
                <Image 
                  source={{ uri: userProfile.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <IconSymbol name="person.circle.fill" size={80} color={currentColors.primary} />
              )}
              <View style={styles.cameraIconContainer}>
                <IconSymbol name="camera.fill" size={20} color={currentColors.card} />
              </View>
            </Pressable>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
            <Text style={styles.profilePhone}>{userProfile.phone}</Text>
          </View>

          {/* Points Card */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <IconSymbol name="star.fill" size={32} color={currentColors.highlight} />
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Reward Points</Text>
                <Text style={styles.pointsValue}>{userProfile.points}</Text>
              </View>
            </View>
            <Text style={styles.pointsSubtext}>
              Earn 1 point for every dollar spent. Use points for discounts or redeem exclusive merch!
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol name="bag.fill" size={24} color={currentColors.primary} />
              <Text style={styles.statValue}>{userProfile.orders.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="giftcard.fill" size={24} color={currentColors.primary} />
              <Text style={styles.statValue}>{userProfile.giftCards.length}</Text>
              <Text style={styles.statLabel}>Gift Cards</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="creditcard.fill" size={24} color={currentColors.primary} />
              <Text style={styles.statValue}>{userProfile.paymentMethods.length}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
          </View>

          {/* Order History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {userProfile.orders.length > 0 && (
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push('/order-history');
                  }}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              )}
            </View>
            {userProfile.orders.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="bag" size={48} color={currentColors.textSecondary} />
                <Text style={styles.emptyStateText}>No orders yet</Text>
              </View>
            ) : (
              userProfile.orders.slice(0, 3).map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, styles[`status${order.status}`]]}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderItems}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                    <View style={styles.orderPoints}>
                      <IconSymbol name="star.fill" size={14} color={currentColors.highlight} />
                      <Text style={styles.orderPointsText}>+{order.pointsEarned} pts</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/edit-profile');
              }}
            >
              <IconSymbol name="person.fill" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/theme-settings');
              }}
            >
              <IconSymbol name="paintbrush.fill" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Theme & Appearance</Text>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/payment-methods');
              }}
            >
              <IconSymbol name="creditcard.fill" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Payment Methods</Text>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/order-history');
              }}
            >
              <IconSymbol name="clock.fill" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Order History</Text>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/events');
              }}
            >
              <IconSymbol name="calendar" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Private Events</Text>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/notifications');
              }}
            >
              <IconSymbol name="bell.fill" size={20} color={currentColors.primary} />
              <Text style={styles.actionButtonText}>Notifications</Text>
              {unreadNotifications > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{unreadNotifications}</Text>
                </View>
              )}
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
