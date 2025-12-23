
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService, Post } from '@/services/socialService';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function DiscoverScreen() {
  const router = useRouter();
  const { currentColors, showToast } = useApp();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadPosts = useCallback(async (refresh = false) => {
    try {
      const currentOffset = refresh ? 0 : offset;
      const { data, error } = await socialService.getDiscoveryFeed(LIMIT, currentOffset);

      if (error) {
        console.error('Error loading posts:', error);
        showToast('Failed to load posts', 'error');
        return;
      }

      if (data) {
        if (refresh) {
          setPosts(data);
          setOffset(LIMIT);
        } else {
          setPosts((prev) => [...prev, ...data]);
          setOffset((prev) => prev + LIMIT);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset, showToast]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && posts.length >= LIMIT) {
      setLoadingMore(true);
      loadPosts(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!isAuthenticated) {
      showToast('Please sign in to like posts', 'info');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (isLiked) {
        await socialService.unlikePost(postId);
      } else {
        await socialService.likePost(postId);
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLikedByCurrentUser: !isLiked,
                likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
    }
  };

  const handleComment = (postId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/post-detail?postId=${postId}`);
  };

  const handleCreatePost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!isAuthenticated) {
      showToast('Please sign in to create posts', 'info');
      return;
    }
    router.push('/create-post');
  };

  const renderPost = ({ item }: { item: Post }) => (
    <LinearGradient
      colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.postCard, { borderColor: currentColors.border }]}
    >
      {/* User Info */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {item.user?.profileImage ? (
            <Image source={{ uri: item.user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: currentColors.secondary }]}>
              <IconSymbol
                name="person.fill"
                size={20}
                color={currentColors.background}
              />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: currentColors.text }]}>
              {item.user?.name || 'Unknown User'}
            </Text>
            {item.locationVerified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol
                  name="checkmark.seal.fill"
                  size={14}
                  color={currentColors.primary}
                />
                <Text style={[styles.verifiedText, { color: currentColors.primary }]}>
                  Taken at Jagabans L.A.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Post Image */}
      <TouchableOpacity onPress={() => handleComment(item.id)}>
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id, item.isLikedByCurrentUser || false)}
        >
          <IconSymbol
            name={item.isLikedByCurrentUser ? 'heart.fill' : 'heart'}
            size={24}
            color={item.isLikedByCurrentUser ? '#FF3B30' : currentColors.text}
          />
          <Text style={[styles.actionText, { color: currentColors.text }]}>
            {item.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
          <IconSymbol
            name="bubble.left"
            size={24}
            color={currentColors.text}
          />
          <Text style={[styles.actionText, { color: currentColors.text }]}>
            {item.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {item.caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: currentColors.text }]}>
            <Text style={styles.captionUsername}>{item.user?.name || 'User'}</Text>{' '}
            {item.caption}
          </Text>
        </View>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: currentColors.textSecondary }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Discover</Text>
            <TouchableOpacity onPress={handleCreatePost} style={styles.createButton}>
              <IconSymbol
                name="camera.fill"
                size={24}
                color={currentColors.secondary}
              />
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.secondary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Discover</Text>
          <TouchableOpacity onPress={handleCreatePost} style={[styles.createButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}>
            <IconSymbol
              name="camera.fill"
              size={24}
              color={currentColors.secondary}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Posts Feed */}
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={currentColors.secondary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={currentColors.secondary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="photo.on.rectangle"
                size={80}
                color={currentColors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: currentColors.text }]}>
                No posts yet. Be the first to share!
              </Text>
              <LinearGradient
                colors={[currentColors.secondary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButton}
              >
                <TouchableOpacity
                  style={styles.emptyButtonInner}
                  onPress={handleCreatePost}
                >
                  <Text style={[styles.emptyButtonText, { color: currentColors.background }]}>Create Post</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          }
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
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  postCard: {
    borderRadius: 0,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  postImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  captionUsername: {
    fontFamily: 'Inter_600SemiBold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  emptyButtonInner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
