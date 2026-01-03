
import * as FileSystem from 'expo-file-system/legacy';
import Share from 'react-native-share';
import { Post } from '@/services/socialService';
import { Platform } from 'react-native';

export const formatPostShareOptions = (userName: string, caption: string, postId: string, imageUrl?: string) => {
  const appScheme = 'jagabansla://';
  const deepLink = `${appScheme}post/${postId}`;
  const webUrl = `https://jagabansla.com/post/${postId}`;
  const appStoreUrl = 'https://apps.apple.com/app/jagabansla';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ooosumfoods.jagabansla';
  
  const message = `Check out this post by ${userName}!\n\n${caption}\n\nOpen in app: ${webUrl}\n\nDownload Apple: ${appStoreUrl}\n\nDownload Android: ${playStoreUrl}`;
  
  return { message, deepLink, webUrl, imageUrl };
};

export const sharePost = async (post: Post) => {
  try {
    console.log('Starting share process for post:', post.id);
    console.log('Post imageUrl:', post.imageUrl);

    if (!post.imageUrl || typeof post.imageUrl !== 'string' || post.imageUrl.trim() === '') {
      throw new Error('Post image URL is missing or invalid');
    }

    const cacheDir = FileSystem.cacheDirectory + 'shared-images/';
    console.log('Cache directory:', cacheDir);
    
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      console.log('Creating cache directory...');
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const localUri = cacheDir + `post_${Date.now()}.jpg`;
    console.log('Downloading image to:', localUri);
    console.log('From URL:', post.imageUrl);
    
    const downloadResult = await FileSystem.downloadAsync(
      post.imageUrl,
      localUri
    );
    
    console.log('Download result:', downloadResult);

    if (!downloadResult.uri) {
      throw new Error('Failed to download image');
    }

    let fileUri = downloadResult.uri;
    if (!fileUri.startsWith('file://')) {
      fileUri = 'file://' + fileUri;
    }

    const userName = post.user?.name || 'Jagabans L.A.';
    const shareOptions = formatPostShareOptions(userName, post.caption || '', post.id, post.imageUrl);
    
    console.log('Sharing with options:', shareOptions);
    
    const options: any = {
      title: `Post by ${userName}`,
      message: shareOptions.message,
      subject: `Post by ${userName}`,
      type: 'image/jpeg',
      link: shareOptions.webUrl, // Use web URL for WhatsApp/messaging apps
    };

    if (Platform.OS === 'android') {
      options.urls = [fileUri];
    } else {
      options.url = fileUri;
    }

    await Share.open(options);

    console.log('Share completed successfully');

  } catch (error: any) {
    console.error('Share error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      postId: post.id,
      imageUrl: post.imageUrl
    });
    throw error;
  }
};
