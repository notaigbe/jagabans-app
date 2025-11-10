
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
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { userProfile, updateProfileImage, currentColors } = useApp();
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(false);

  const handleImagePick = async () => {
    console.log('Picking image from library');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateProfileImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    console.log('Taking photo with camera');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateProfileImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const showImageOptions = () => {
    console.log('Showing image options');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handleImagePick },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const menuItems = [
    { icon: 'person.circle', label: 'Edit Profile', route: '/edit-profile' },
    { icon: 'clock', label: 'Order History', route: '/order-history' },
    { icon: 'creditcard', label: 'Payment Methods', route: '/payment-methods' },
    { icon: 'bell', label: 'Notifications', route: '/notifications' },
    { icon: 'calendar', label: 'Events', route: '/events' },
    { icon: 'paintbrush', label: 'Theme Settings', route: '/theme-settings' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: currentColors.card }]}>
          <Pressable onPress={showImageOptions} style={styles.imageContainer}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: currentColors.accent }]}>
                <IconSymbol name="person.fill" size={50} color={currentColors.primary} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: currentColors.primary }]}>
              <IconSymbol name="camera.fill" size={16} color={currentColors.card} />
            </View>
          </Pressable>
          <Text style={[styles.profileName, { color: currentColors.text }]}>{userProfile.name}</Text>
          <Text style={[styles.profileEmail, { color: currentColors.textSecondary }]}>{userProfile.email}</Text>
        </View>

        {/* Points Card */}
        <View style={[styles.pointsCard, { backgroundColor: currentColors.primary }]}>
          <View style={styles.pointsContent}>
            <IconSymbol name="star.fill" size={32} color={currentColors.card} />
            <View style={styles.pointsInfo}>
              <Text style={[styles.pointsLabel, { color: currentColors.card }]}>Reward Points</Text>
              <Text style={[styles.pointsValue, { color: currentColors.card }]}>{userProfile.points}</Text>
            </View>
          </View>
          <Text style={[styles.pointsSubtext, { color: currentColors.card }]}>
            Earn 1 point for every dollar spent
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: currentColors.card }]}>
            <IconSymbol name="bag.fill" size={24} color={currentColors.primary} />
            <Text style={[styles.statValue, { color: currentColors.text }]}>{userProfile.orders.length}</Text>
            <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentColors.card }]}>
            <IconSymbol name="giftcard.fill" size={24} color={currentColors.primary} />
            <Text style={[styles.statValue, { color: currentColors.text }]}>{userProfile.giftCards.length}</Text>
            <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Gift Cards</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentColors.card }]}>
            <IconSymbol name="calendar" size={24} color={currentColors.primary} />
            <Text style={[styles.statValue, { color: currentColors.text }]}>{userProfile.rsvpEvents.length}</Text>
            <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Events</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[styles.menuItem, { backgroundColor: currentColors.card }]}
              onPress={() => {
                console.log('Menu item pressed:', item.label);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route);
              }}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name={item.icon as any} size={24} color={currentColors.primary} />
                <Text style={[styles.menuItemLabel, { color: currentColors.text }]}>{item.label}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={currentColors.textSecondary} />
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
  contentContainer: {
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
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
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  pointsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsInfo: {
    marginLeft: 16,
  },
  pointsLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.9,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsSubtext: {
    fontSize: 12,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
