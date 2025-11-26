
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { userService } from '@/services/supabaseService';
import { useApp } from '@/contexts/AppContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  active: boolean;
  userRole: 'user' | 'admin' | 'super_admin';
}

export default function AdminUserManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get all users
      const { data: userProfiles, error: usersError } = await (supabase as any)
        .from('user_profiles')
        .select('*');

      if (usersError) throw usersError;

      // Get all orders to calculate stats
      const { data: orders, error: ordersError } = await (supabase as any)
        .from('orders')
        .select('user_id, total, created_at');

      if (ordersError) throw ordersError;

      // Combine data
      const formattedUsers: User[] = (userProfiles || []).map((profile: any) => {
        const userOrders = (orders || []).filter((o: any) => o.user_id === profile.id);
        const totalSpent = userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || 'N/A',
          points: profile.points || 0,
          totalOrders: userOrders.length,
          totalSpent,
          joinDate: profile.created_at || new Date().toISOString(),
          active: true,
          userRole: profile.user_role || 'user',
        };
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Alert.alert(
        'Promote to Admin',
        `Are you sure you want to promote ${userName} to admin?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Promote',
            onPress: async () => {
              const { error } = await userService.updateUserRole(userId, 'admin');

              if (error) {
                Alert.alert('Error', 'Failed to promote user to admin');
                return;
              }

              Alert.alert('Success', `${userName} has been promoted to admin`);
              fetchUsers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error promoting user:', error);
      Alert.alert('Error', 'Failed to promote user to admin');
    }
  };

  const handleRevokeAdmin = async (userId: string, userName: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Alert.alert(
        'Revoke Admin',
        `Are you sure you want to revoke admin privileges from ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: async () => {
              const { error } = await userService.updateUserRole(userId, 'user');

              if (error) {
                Alert.alert('Error', 'Failed to revoke admin privileges');
                return;
              }

              Alert.alert('Success', `Admin privileges revoked from ${userName}`);
              fetchUsers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error revoking admin:', error);
      Alert.alert('Error', 'Failed to revoke admin privileges');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate active users (excluding admins and super_admins)
  const activeRegularUsers = users.filter((u) => u.active && u.userRole === 'user').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(admin)' as any);
            }
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activeRegularUsers}
            </Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <View style={styles.usersContainer}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={[
                  styles.userAvatar,
                  { backgroundColor: user.userRole === 'super_admin' ? '#FF6B35' : user.userRole === 'admin' ? '#9B59B6' : colors.primary }
                ]}>
                  <Text style={styles.userInitials}>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.userRole === 'super_admin' && (
                      <View style={styles.superAdminBadge}>
                        <Text style={styles.badgeText}>Super Admin</Text>
                      </View>
                    )}
                    {user.userRole === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.badgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: user.active ? '#4CAF50' : '#FF6B6B' },
                  ]}
                />
              </View>

              <View style={styles.userStats}>
                <View style={styles.userStat}>
                  <IconSymbol name="stars" size={20} color={colors.primary} />
                  <Text style={styles.userStatValue}>{user.points}</Text>
                  <Text style={styles.userStatLabel}>Points</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="receipt-long" size={20} color="#4ECDC4" />
                  <Text style={styles.userStatValue}>{user.totalOrders}</Text>
                  <Text style={styles.userStatLabel}>Orders</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="attach-money" size={20} color="#95E1D3" />
                  <Text style={styles.userStatValue}>
                    ${user.totalSpent.toFixed(0)}
                  </Text>
                  <Text style={styles.userStatLabel}>Spent</Text>
                </View>
              </View>

              <View style={styles.userFooter}>
                <Text style={styles.joinDate}>
                  Joined: {new Date(user.joinDate).toLocaleDateString()}
                </Text>
                <View style={styles.userActions}>
                  {userProfile?.userRole === 'super_admin' && user.userRole !== 'super_admin' && (
                    <Pressable
                      style={[
                        styles.actionButton,
                        user.userRole === 'admin' && styles.revokeButton,
                      ]}
                      onPress={() => {
                        if (user.userRole === 'admin') {
                          handleRevokeAdmin(user.id, user.name);
                        } else {
                          handlePromoteToAdmin(user.id, user.name);
                        }
                      }}
                    >
                      <IconSymbol
                        name={user.userRole === 'admin' ? 'remove-circle' : 'admin-panel-settings'}
                        size={16}
                        color={user.userRole === 'admin' ? '#FF6B6B' : colors.primary}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          user.userRole === 'admin' && styles.revokeButtonText,
                        ]}
                      >
                        {user.userRole === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="people" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  usersContainer: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  superAdminBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: '#9B59B6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  joinDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  revokeButton: {
    borderColor: '#FF6B6B',
  },
  revokeButtonText: {
    color: '#FF6B6B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
