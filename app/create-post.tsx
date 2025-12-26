
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService } from '@/services/socialService';
import { IconSymbol } from '@/components/IconSymbol';
import Toast from '@/components/Toast';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/app/integrations/supabase/client';
import { JAGABANS_LOCATION } from '@/constants/LocationConfig';
import * as Haptics from 'expo-haptics';

export default function CreatePostScreen() {
  const router = useRouter();
  const { currentColors } = useApp();
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isAtRestaurant, setIsAtRestaurant] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      showToast('Camera and location permissions are required', 'error');
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkLocationTag = async () => {
    setCheckingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        JAGABANS_LOCATION.latitude,
        JAGABANS_LOCATION.longitude
      );

      console.log('Distance from Jagabans:', distance, 'meters');

      const atRestaurant = distance <= JAGABANS_LOCATION.radius;
      setIsAtRestaurant(atRestaurant);
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (atRestaurant) {
        showToast('📍 Photo taken at Jagabans L.A.!', 'success');
      }

      return atRestaurant;
    } catch (error) {
      console.error('Location check error:', error);
      // Don't block posting if location check fails
      setIsAtRestaurant(false);
      setCurrentLocation(null);
      return false;
    } finally {
      setCheckingLocation(false);
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        // Check location after taking photo (non-blocking)
        await checkLocationTag();
      }
    } catch (error) {
      console.error('Camera error:', error);
      showToast('Failed to take photo', 'error');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      if (!user) {
        console.error('No user found');
        return null;
      }

      console.log('Starting image upload for URI:', uri);

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('Image blob created, size:', blob.size, 'type:', blob.type);

      // Generate unique filename with proper extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/post_${Date.now()}.${fileExt}`;

      console.log('Uploading to posts bucket with filename:', fileName);

      // Upload to Supabase Storage in the 'posts' bucket
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL (posts bucket is public)
      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handlePost = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!imageUri) {
      showToast('Please take a photo first', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting post creation...');
      
      // Upload image
      const imageUrl = await uploadImage(imageUri);
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      console.log('Image uploaded successfully:', imageUrl);

      // Create post with location tag
      const { data, error } = await socialService.createPost(
        imageUrl,
        currentLocation?.latitude || 0,
        currentLocation?.longitude || 0,
        caption || undefined,
        isAtRestaurant
      );

      if (error) {
        console.error('Create post error:', error);
        throw error;
      }

      console.log('Post created successfully:', data);

      showToast('Post created successfully!', 'success');
      
      // Wait a bit for toast to show before navigating
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Create post error:', error);
      showToast('Failed to create post. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
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
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }} 
            style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={currentColors.secondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={loading || !imageUri}
            style={[styles.postButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={currentColors.secondary} />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  {
                    color: !imageUri ? currentColors.textSecondary : currentColors.secondary,
                  },
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Location Status */}
          {imageUri && (
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.locationCard,
                {
                  borderColor: isAtRestaurant ? '#4CAF50' : currentColors.border,
                },
              ]}
            >
              <View style={styles.locationHeader}>
                <IconSymbol
                  name={isAtRestaurant ? 'mappin.and.ellipse' : 'location.fill'}
                  size={24}
                  color={isAtRestaurant ? '#4CAF50' : currentColors.textSecondary}
                />
                <Text style={[styles.locationText, { color: currentColors.text }]}>
                  {checkingLocation
                    ? 'Checking location...'
                    : isAtRestaurant
                    ? '📍 Taken at Jagabans L.A.'
                    : 'Location: Not at restaurant'}
                </Text>
              </View>
              <Text style={[styles.locationSubtext, { color: currentColors.textSecondary }]}>
                {isAtRestaurant
                  ? 'Your post will be tagged with the restaurant location'
                  : 'You can post from anywhere! Photos taken at the restaurant get a special badge.'}
              </Text>
            </LinearGradient>
          )}

          {/* Camera Button */}
          {!imageUri && (
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cameraButton, { borderColor: currentColors.border }]}
            >
              <TouchableOpacity
                style={styles.cameraButtonInner}
                onPress={takePhoto}
                disabled={checkingLocation}
              >
                {checkingLocation ? (
                  <ActivityIndicator size="large" color={currentColors.secondary} />
                ) : (
                  <>
                    <IconSymbol
                      name="camera.fill"
                      size={64}
                      color={currentColors.secondary}
                    />
                    <Text style={[styles.cameraButtonText, { color: currentColors.text }]}>
                      Take Photo
                    </Text>
                    <Text style={[styles.cameraButtonSubtext, { color: currentColors.textSecondary }]}>
                      Share your experience from anywhere!
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              {isAtRestaurant && (
                <View style={styles.locationBadge}>
                  <IconSymbol name="mappin.circle.fill" size={16} color="#fff" />
                  <Text style={styles.locationBadgeText}>Jagabans L.A.</Text>
                </View>
              )}
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.retakeButton, { borderColor: currentColors.border }]}
              >
                <TouchableOpacity
                  style={styles.retakeButtonInner}
                  onPress={takePhoto}
                >
                  <IconSymbol
                    name="camera.rotate"
                    size={20}
                    color={currentColors.text}
                  />
                  <Text style={[styles.retakeButtonText, { color: currentColors.text }]}>
                    Retake Photo
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Caption Input */}
          {imageUri && (
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.captionContainer, { borderColor: currentColors.border }]}
            >
              <Text style={[styles.captionLabel, { color: currentColors.text }]}>
                Caption (Optional)
              </Text>
              <TextInput
                style={[
                  styles.captionInput,
                  {
                    color: currentColors.text,
                    borderColor: currentColors.border,
                  },
                ]}
                placeholder="Write a caption..."
                placeholderTextColor={currentColors.textSecondary}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
              <Text style={[styles.characterCount, { color: currentColors.textSecondary }]}>
                {caption.length}/500
              </Text>
            </LinearGradient>
          )}
        </ScrollView>

        {/* Toast Notification */}
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
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  postButtonText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  locationCard: {
    padding: 16,
    borderRadius: 0,
    borderWidth: 2,
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 12,
    flex: 1,
  },
  locationSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    marginLeft: 36,
  },
  cameraButton: {
    padding: 48,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  cameraButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
  },
  cameraButtonSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 400,
    borderRadius: 0,
    resizeMode: 'cover',
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  locationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 0,
    marginTop: 12,
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  retakeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  captionContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 0,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  captionLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 2,
    borderRadius: 0,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    textAlign: 'right',
  },
});
