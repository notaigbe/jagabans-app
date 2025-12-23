
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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/app/integrations/supabase/client';
import { JAGABANS_LOCATION } from '@/constants/LocationConfig';
// import {BodyScrollView} from '@/components/BodyScrollView';
import * as Haptics from 'expo-haptics';

export default function CreatePostScreen() {
  const router = useRouter();
  const { currentColors, showToast } = useApp();
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  const verifyLocation = async () => {
    setVerifyingLocation(true);
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

      if (distance <= JAGABANS_LOCATION.radius) {
        setLocationVerified(true);
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        showToast('Location verified! You are at Jagabans L.A.', 'success');
        return true;
      } else {
        setLocationVerified(false);
        showToast(
          `You must be at Jagabans L.A. to post. You are ${Math.round(distance)}m away.`,
          'error'
        );
        return false;
      }
    } catch (error) {
      console.error('Location verification error:', error);
      showToast('Failed to verify location', 'error');
      return false;
    } finally {
      setVerifyingLocation(false);
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Verify location first
      const isLocationValid = await verifyLocation();
      if (!isLocationValid) {
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showToast('Failed to take photo', 'error');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      if (!user) return null;

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const fileExt = uri.split('.').pop();
      const fileName = `post_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile')
        .getPublicUrl(filePath);

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

    if (!locationVerified || !currentLocation) {
      showToast('Location not verified', 'error');
      return;
    }

    setLoading(true);
    try {
      // Upload image
      const imageUrl = await uploadImage(imageUri);
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      // Create post
      const { data, error } = await socialService.createPost(
        imageUrl,
        currentLocation.latitude,
        currentLocation.longitude,
        caption || undefined
      );

      if (error) throw error;

      showToast('Post created successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Create post error:', error);
      showToast('Failed to create post', 'error');
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
            disabled={loading || !imageUri || !locationVerified}
            style={[styles.postButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={currentColors.secondary} />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  {
                    color:
                      !imageUri || !locationVerified
                        ? currentColors.textSecondary
                        : currentColors.secondary,
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
          <LinearGradient
            colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.locationCard,
              {
                borderColor: locationVerified ? '#4CAF50' : currentColors.border,
              },
            ]}
          >
            <View style={styles.locationHeader}>
              <IconSymbol
                name={locationVerified ? 'checkmark.seal.fill' : 'location.fill'}
                size={24}
                color={locationVerified ? '#4CAF50' : currentColors.textSecondary}
              />
              <Text style={[styles.locationText, { color: currentColors.text }]}>
                {locationVerified
                  ? 'Location Verified - At Jagabans L.A.'
                  : 'Location Not Verified'}
              </Text>
            </View>
            {!locationVerified && (
              <Text style={[styles.locationSubtext, { color: currentColors.textSecondary }]}>
                You must be at the restaurant to post
              </Text>
            )}
          </LinearGradient>

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
                disabled={verifyingLocation}
              >
                {verifyingLocation ? (
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
                      Location will be verified when you take the photo
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
  },
  imagePreview: {
    width: '100%',
    height: 400,
    borderRadius: 0,
    resizeMode: 'cover',
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
