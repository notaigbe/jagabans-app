
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';

const APP_STORE_ID = 'YOUR_APP_STORE_ID';
const PLAY_STORE_ID = 'YOUR_PLAY_STORE_ID';
const APP_SCHEME = 'jagabansla';

const generatePostDeepLink = (postId: string) => `${APP_SCHEME}://post-detail?postId=${postId}`;

const generateUniversalPostLink = () => {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/id${APP_STORE_ID}`;
  }
  return `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
};

/**
 * Downloads an image from a URL to local cache and returns the local file URI
 */
const downloadImageToLocal = async (imageUrl: string): Promise<string | null> => {
  try {
    // Create a cache directory for shared images
    const cacheDir = new Directory(Paths.cache, 'shared-images');
    
    // Create directory if it doesn't exist
    if (!cacheDir.exists) {
      cacheDir.create({ intermediates: true });
    }

    // Extract filename from URL or generate one
    const filename = `post-${Date.now()}.jpg`;
    
    // Download the image
    const downloadedFile = await File.downloadFileAsync(imageUrl, cacheDir);
    
    console.log('Image downloaded to:', downloadedFile.uri);
    return downloadedFile.uri;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
};

export const formatPostShareOptions = async (
  userName: string,
  caption: string,
  postId: string,
  imageUrl?: string
) => {
  const deepLink = generatePostDeepLink(postId);
  const downloadLink = generateUniversalPostLink();
  
  // Format the share message with post content and links
  // Using proper formatting to make links clickable
  const message = `Check out this post from ${userName}!\n\n${caption}\n\n🔗 Open in app:\n${deepLink}\n\n📱 Download the app:\n${downloadLink}`;
  
  // Download image to local file if provided
  let localImageUri: string | null = null;
  if (imageUrl) {
    localImageUri = await downloadImageToLocal(imageUrl);
  }

  // Build share options
  // Using 'url' for the primary link (makes it clickable)
  // Using 'urls' array to include the image file
  const shareOptions: any = {
    title: `Post from ${userName}`,
    message: message,
    url: deepLink, // This makes the link clickable on most platforms
  };

  // Add the local image file to the share
  if (localImageUri) {
    // On iOS, we can use urls array to share multiple items
    // On Android, we use url for the image
    if (Platform.OS === 'ios') {
      shareOptions.urls = [localImageUri];
    } else {
      // For Android, we need to use the 'url' field for the image
      // and include the message separately
      shareOptions.url = localImageUri;
      shareOptions.message = message;
    }
  }

  return shareOptions;
};

export const sharePost = async (
  userName: string,
  caption: string,
  postId: string,
  imageUrl?: string
) => {
  try {
    const shareOptions = await formatPostShareOptions(userName, caption, postId, imageUrl);
    await Share.open(shareOptions);
  } catch (error: any) {
    if (error.message !== 'User did not share' && error.message !== 'User did cancel') {
      console.error('Share error:', error);
      throw error;
    }
  }
};
