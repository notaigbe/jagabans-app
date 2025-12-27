import { Platform } from 'react-native';

type SharePayload = {
  title?: string;
  message?: string;
  url?: string;
};

export async function shareContent(payload: SharePayload) {
  const { title, message, url } = payload;

  // 🌐 WEB
  if (Platform.OS === 'web') {
    if (navigator.share) {
      await navigator.share({
        title,
        text: message,
        url,
      });
      return;
    }

    // Fallback: copy to clipboard
    if (url) {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    }
    return;
  }

  // 📱 NATIVE (dynamic import avoids web crash)
  const Share = (await import('react-native-share')).default;

  await Share.open({
    title,
    message,
    url,
    failOnCancel: false,
  });
}
