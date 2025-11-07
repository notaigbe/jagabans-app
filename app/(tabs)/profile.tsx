
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
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
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, updateProfileImage, currentColors } = useApp();
  const [imageLoading, setImageLoading] = useState(false);

  const handleImagePick = async () => {
    console.log('Picking image from library');
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    console.log('Taking photo with camera');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageLoading(true);
      updateProfileImage(result.assets[0].uri);
      setImageLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handleImagePick },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'person.circle' as const,
      route: '/edit-profile',
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      icon: 'creditcard' as const,
      route: '/payment-methods',
    },
    {
      id: 'order-history',
      title: 'Order History',
      icon: 'clock' as const,
      route: '/order-history',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell.fill' as const,
      route: '/notifications',
      badge: userProfile.notifications.filter((n) => !n.read).length,
    },
    {
      id: 'events',
      title: 'Private Events',
      icon: 'calendar' as const,
      route: '/events',
    },
    {
      id: 'theme-settings',
      title: 'Theme Settings',
      icon: 'paintbrush.fill' as const,
      route: '/theme-settings',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Profile</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: currentColors.card }]}>
          <Pressable onPress={showImageOptions} style={styles.avatarContainer}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: currentColors.primary }]}>
                <IconSymbol name="person.fill" size={48} color={currentColors.card} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: currentColors.primary }]}>
              <IconSymbol name="camera.fill" size={16} color={currentColors.card} />
            </View>
          </Pressable>
          <Text style={[styles.userName, { color: currentColors.text }]}>{userProfile.name}</Text>
          <Text style={[styles.userEmail, { color: currentColors.textSecondary }]}>{userProfile.email}</Text>
        </View>

        <View style={[styles.pointsCard, { backgroundColor: currentColors.card }]}>
          <View style={styles.pointsContent}>
            <IconSymbol name="star.fill" size={32} color={currentColors.highlight} />
            <View style={styles.pointsInfo}>
              <Text style={[styles.pointsLabel, { color: currentColors.textSecondary }]}>Reward Points</Text>
              <Text style={[styles.pointsValue, { color: currentColors.primary }]}>{userProfile.points}</Text>
            </View>
          </View>
          <Text style={[styles.pointsSubtext, { color: currentColors.textSecondary }]}>
            Earn 1 point for every dollar spent
          </Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.menuItem, { backgroundColor: currentColors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: currentColors.primary + '20' }]}>
                  <IconSymbol name={item.icon} size={20} color={currentColors.primary} />
                </View>
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>{item.title}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && item.badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
                    <Text style={[styles.badgeText, { color: currentColors.card }]}>{item.badge}</Text>
                  </View>
                ) : null}
                <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  pointsContent: {
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
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsSubtext: {
    fontSize: 12,
  },
  menuSection: {
    paddingHorizontal: 20,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
