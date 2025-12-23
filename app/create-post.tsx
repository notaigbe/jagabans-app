
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService } from '@/services/socialService';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/app/integrations/supabase/client';
import { JAGABANS_LOCATION } from '@/constants/LocationConfig';
import BodyScrollView from '@/components/BodyScrollView';

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
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentColors.card,
            paddingTop: Platform.OS === 'android' ? 48 : 0,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={currentColors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentColors.text }]}>Create Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={loading || !imageUri || !locationVerified}
          style={styles.postButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color={currentColors.primary} />
          ) : (
            <Text
              style={[
                styles.postButtonText,
                {
                  color:
                    !imageUri || !locationVerified
                      ? currentColors.textSecondary
                      : currentColors.primary,
                },
              ]}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <BodyScrollView style={styles.content}>
        {/* Location Status */}
        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: currentColors.card,
              borderColor: locationVerified ? '#4CAF50' : currentColors.border,
            },
          ]}
        >
          <View style={styles.locationHeader}>
            <IconSymbol
              ios_icon_name={locationVerified ? 'checkmark.seal.fill' : 'location.fill'}
              android_material_icon_name={locationVerified ? 'verified' : 'location_on'}
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
        </View>

        {/* Camera Button */}
        {!imageUri && (
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: currentColors.card }]}
            onPress={takePhoto}
            disabled={verifyingLocation}
          >
            {verifyingLocation ? (
              <ActivityIndicator size="large" color={currentColors.primary} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="photo_camera"
                  size={64}
                  color={currentColors.primary}
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
        )}

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={[styles.retakeButton, { backgroundColor: currentColors.card }]}
              onPress={takePhoto}
            >
              <IconSymbol
                ios_icon_name="camera.rotate"
                android_material_icon_name="cameraswitch"
                size={20}
                color={currentColors.text}
              />
              <Text style={[styles.retakeButtonText, { color: currentColors.text }]}>
                Retake Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Caption Input */}
        {imageUri && (
          <View style={styles.captionContainer}>
            <Text style={[styles.captionLabel, { color: currentColors.text }]}>
              Caption (Optional)
            </Text>
            <TextInput
              style={[
                styles.captionInput,
                {
                  backgroundColor: currentColors.card,
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
          </View>
        )}
      </BodyScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    padding: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  locationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  locationSubtext: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 36,
  },
  cameraButton: {
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  cameraButtonText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  cameraButtonSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  captionContainer: {
    marginBottom: 24,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});
