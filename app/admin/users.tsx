
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { userService, eventService } from '@/services/supabaseService';
import { useApp } from '@/contexts/AppContext';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';

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

interface UserRSVP {
  id: string;
  event_id: string;
  event: {
    id: string;
    title: string;
    date: string;
  };
}

export default function AdminUserManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRSVPs, setUserRSVPs] = useState<UserRSVP[]>([]);
  const [loadingRSVPs, setLoadingRSVPs] = useState(false);
  const [bannedEvents, setBannedEvents] = useState<Set<string>>(new Set());

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const isSuperAdmin = userProfile?.userRole === 'super_admin';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query based on user role
      let query = (supabase as any).from('user_profiles').select('*');
      
      // If regular admin, only show users with user_role = 'user'
      if (!isSuperAdmin) {
        query = query.eq('user_role', 'user');
      }
      // If super_admin, show all users (no filter needed)

      const { data: userProfiles, error: usersError } = await query;

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
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const loadUserRSVPs = async (userId: string) => {
    try {
      setLoadingRSVPs(true);
      const { data, error } = await eventService.getUserRSVPs(userId);
      
      if (error) {
        console.error('Error loading user RSVPs:', error);
        showToast('error', 'Failed to load user RSVPs');
        return;
      }

      setUserRSVPs(data || []);

      // Load banned events for this user
      const { data: bans, error: bansError } = await eventService.getUserEventBans(userId);
      if (!bansError && bans) {
        setBannedEvents(new Set(bans.map((ban: any) => ban.event_id)));
      }
    } catch (error) {
      console.error('Error loading user RSVPs:', error);
      showToast('error', 'Failed to load user RSVPs');
    } finally {
      setLoadingRSVPs(false);
    }
  };

  const handleViewUserDetails = async (user: User) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedUser(user);
    await loadUserRSVPs(user.id);
  };

  const handleCancelUserRSVP = async (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog(
      'Cancel User RSVP',
      `Are you sure you want to cancel this user's reservation for "${eventTitle}"? They will be notified.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await eventService.adminCancelRSVP(userId, eventId);

              if (error) {
                showToast('error', 'Failed to cancel RSVP');
                return;
              }

              showToast('success', 'RSVP cancelled successfully. User has been notified.');
              
              // Reload RSVPs
              if (selectedUser) {
                await loadUserRSVPs(selectedUser.id);
              }
            } catch (error) {
              console.error('Error cancelling RSVP:', error);
              showToast('error', 'Failed to cancel RSVP');
            }
          },
        },
      ]
    );
  };

  const handleBanUserFromEvent = async (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog(
      'Ban User from Event',
      `Are you sure you want to ban this user from "${eventTitle}"? They will not be able to RSVP to this event.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Ban User',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await eventService.banUserFromEvent(userId, eventId, 'Banned by admin');

              if (error) {
                showToast('error', 'Failed to ban user from event');
                return;
              }

              showToast('success', 'User has been banned from this event');
              
              // Reload RSVPs and bans
              if (selectedUser) {
                await loadUserRSVPs(selectedUser.id);
              }
            } catch (error) {
              console.error('Error banning user:', error);
              showToast('error', 'Failed to ban user from event');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUserFromEvent = async (userId: string, eventId: string, eventTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog(
      'Unban User from Event',
      `Are you sure you want to unban this user from "${eventTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Unban User',
          onPress: async () => {
            try {
              const { error } = await eventService.unbanUserFromEvent(userId, eventId);

              if (error) {
                showToast('error', 'Failed to unban user from event');
                return;
              }

              showToast('success', 'User has been unbanned from this event');
              
              // Reload RSVPs and bans
              if (selectedUser) {
                await loadUserRSVPs(selectedUser.id);
              }
            } catch (error) {
              console.error('Error unbanning user:', error);
              showToast('error', 'Failed to unban user from event');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      showDialog(
        'Promote to Admin',
        `Are you sure you want to promote ${userName} to admin?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Promote',
            onPress: async () => {
              const { error } = await userService.updateUserRole(userId, 'admin');

              if (error) {
                showToast('error', 'Failed to promote user to admin');
                return;
              }

              showToast('success', `${userName} has been promoted to admin`);
              fetchUsers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error promoting user:', error);
      showToast('error', 'Failed to promote user to admin');
    }
  };

  const handleRevokeAdmin = async (userId: string, userName: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      showDialog(
        'Revoke Admin',
        `Are you sure you want to revoke admin privileges from ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: async () => {
              const { error } = await userService.updateUserRole(userId, 'user');

              if (error) {
                showToast('error', 'Failed to revoke admin privileges');
                return;
              }

              showToast('success', `Admin privileges revoked from ${userName}`);
              fetchUsers();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error revoking admin:', error);
      showToast('error', 'Failed to revoke admin privileges');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate active users (only regular users)
  const activeRegularUsers = users.filter((u) => u.active && u.userRole === 'user').length;

  if (selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedUser(null);
              setUserRSVPs([]);
              setBannedEvents(new Set());
            }}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{selectedUser.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{selectedUser.email}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{selectedUser.phone}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Points</Text>
              <Text style={styles.detailValue}>{selectedUser.points}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event RSVPs</Text>
          </View>

          {loadingRSVPs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : userRSVPs.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No event RSVPs</Text>
            </View>
          ) : (
            <View style={styles.rsvpList}>
              {userRSVPs.map((rsvp) => {
                const isBanned = bannedEvents.has(rsvp.event_id);
                return (
                  <View key={rsvp.id} style={styles.rsvpCard}>
                    <View style={styles.rsvpInfo}>
                      <Text style={styles.rsvpTitle}>{rsvp.event.title}</Text>
                      <Text style={styles.rsvpDate}>
                        {new Date(rsvp.event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {isBanned && (
                        <View style={styles.bannedBadge}>
                          <Text style={styles.bannedBadgeText}>User is banned from this event</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rsvpActions}>
                      <Pressable
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleCancelUserRSVP(selectedUser.id, rsvp.event_id, rsvp.event.title)}
                      >
                        <IconSymbol name="xmark" size={16} color="#FF6B6B" />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </Pressable>
                      {isBanned ? (
                        <Pressable
                          style={[styles.actionBtn, styles.unbanBtn]}
                          onPress={() => handleUnbanUserFromEvent(selectedUser.id, rsvp.event_id, rsvp.event.title)}
                        >
                          <IconSymbol name="checkmark" size={16} color="#4CAF50" />
                          <Text style={styles.unbanBtnText}>Unban</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={[styles.actionBtn, styles.banBtn]}
                          onPress={() => handleBanUserFromEvent(selectedUser.id, rsvp.event_id, rsvp.event.title)}
                        >
                          <IconSymbol name="nosign" size={16} color="#FF6B6B" />
                          <Text style={styles.banBtnText}>Ban</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
        />
        <Dialog
          visible={dialogVisible}
          title={dialogConfig.title}
          message={dialogConfig.message}
          buttons={dialogConfig.buttons}
          onHide={() => setDialogVisible(false)}
          currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }}
        />
      </SafeAreaView>
    );
  }

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
        <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
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
            <Text style={styles.statLabel}>
              {isSuperAdmin ? 'Total Users' : 'Regular Users'}
            </Text>
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
            <Pressable
              key={user.id}
              style={styles.userCard}
              onPress={() => handleViewUserDetails(user)}
            >
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
                  <IconSymbol name="star.circle.fill" size={20} color={colors.primary} />
                  <Text style={styles.userStatValue}>{user.points}</Text>
                  <Text style={styles.userStatLabel}>Points</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="receipt" size={20} color="#4ECDC4" />
                  <Text style={styles.userStatValue}>{user.totalOrders}</Text>
                  <Text style={styles.userStatLabel}>Orders</Text>
                </View>
                <View style={styles.userStat}>
                  <IconSymbol name="dollarsign.circle" size={20} color="#95E1D3" />
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
                  <Pressable
                    style={[styles.actionButton, styles.pointsButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push({
                        pathname: '/admin/manage-points',
                        params: {
                          userId: user.id,
                          userName: user.name,
                          currentPoints: user.points.toString(),
                        },
                      } as any);
                    }}
                  >
                    <IconSymbol
                      name="star.circle.fill"
                      size={16}
                      color={colors.highlight}
                    />
                    <Text style={[styles.actionButtonText, styles.pointsButtonText]}>
                      Manage Points
                    </Text>
                  </Pressable>
                  {isSuperAdmin && user.userRole !== 'super_admin' && (
                    <Pressable
                      style={[
                        styles.actionButton,
                        user.userRole === 'admin' && styles.revokeButton,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (user.userRole === 'admin') {
                          handleRevokeAdmin(user.id, user.name);
                        } else {
                          handlePromoteToAdmin(user.id, user.name);
                        }
                      }}
                    >
                      <IconSymbol
                        name={user.userRole === 'admin' ? 'minus.circle.fill' : 'shield.lefthalf.filled'}
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
            </Pressable>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="person.2" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
          </View>
        )}
      </ScrollView>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
      />
      <Dialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        buttons={dialogConfig.buttons}
        onHide={() => setDialogVisible(false)}
        currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }}
      />
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
    textAlign: 'center',
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
  pointsButton: {
    borderColor: colors.highlight,
  },
  pointsButtonText: {
    color: colors.highlight,
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
  detailsContainer: {
    padding: 16,
    gap: 12,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  rsvpList: {
    padding: 16,
    gap: 12,
  },
  rsvpCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rsvpInfo: {
    marginBottom: 12,
  },
  rsvpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  rsvpDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bannedBadge: {
    backgroundColor: '#FF6B6B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bannedBadgeText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  rsvpActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtn: {
    backgroundColor: '#FF6B6B20',
    borderColor: '#FF6B6B',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  banBtn: {
    backgroundColor: '#FF6B6B20',
    borderColor: '#FF6B6B',
  },
  banBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  unbanBtn: {
    backgroundColor: '#4CAF5020',
    borderColor: '#4CAF50',
  },
  unbanBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
