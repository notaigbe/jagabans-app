
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";

export default function AdminDashboard() {
  const router = useRouter();
  const { signIn, isAuthenticated, signOut } = useAuth();
  const { userProfile } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeUsers: 0,
    revenue: 0,
  });
  const [viewAsAdmin, setViewAsAdmin] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const isAdmin = userProfile?.userRole === 'admin' || userProfile?.userRole === 'super_admin';
  const isSuperAdmin = userProfile?.userRole === 'super_admin';
  
  // Effective role based on the toggle
  const effectiveRole = isSuperAdmin && viewAsAdmin ? 'admin' : userProfile?.userRole;
  const isEffectivelyAdmin = effectiveRole === 'admin';
  
  // Show analytics only for super_admin (when not viewing as admin)
  const shouldShowAnalytics = isSuperAdmin && !viewAsAdmin;

  const handleLogin = async () => {
    console.log("Admin login attempt");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!username || !password) {
      showDialog('Login Failed', 'Please enter both email and password.', [
        { text: 'OK', onPress: () => {}, style: 'default' }
      ]);
      return;
    }

    const email = username.includes("@") ? username : `${username}@jagabansla.com`;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      showDialog('Login Failed', 'Invalid credentials. Please try again.', [
        { text: 'OK', onPress: () => {}, style: 'default' }
      ]);
    }
  };

  const handleLogout = async () => {
    console.log("Logging out");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await signOut();
    setUsername("");
    setPassword("");
  };

  const togglePasswordVisibility = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPassword(!showPassword);
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      // Fetch orders
      const ordersResponse = await orderService.getAllOrders();
      const orders = ordersResponse.data || [];

      // Fetch users based on effective role
      let usersQuery = (supabase as any).from("user_profiles").select("*");
      
      // If viewing as admin (or is regular admin), only count users with user_role = 'user'
      if (isEffectivelyAdmin) {
        usersQuery = usersQuery.eq('user_role', 'user');
      }
      // If super_admin (and not viewing as admin), count all users (no filter)

      const usersResponse = await usersQuery;
      const users = usersResponse.data || [];

      const totalOrders = orders.length;
      const activeUsers = users.length;
      const revenue = orders.reduce(
        (sum: number, order: any) => sum + (order.total || 0),
        0
      );

      setStats({
        totalOrders,
        activeUsers,
        revenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        totalOrders: 0,
        activeUsers: 0,
        revenue: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [isEffectivelyAdmin]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && shouldShowAnalytics) {
      fetchStats();
    }
  }, [isAuthenticated, isAdmin, viewAsAdmin, fetchStats, shouldShowAnalytics]);

  const allAdminSections = [
    {
      id: "menu",
      title: "Menu Management",
      description: "Add, edit, and remove menu items",
      icon: "restaurant-menu" as const,
      route: "/admin/menu",
      color: colors.primary,
      superAdminOnly: false,
    },
    {
      id: "orders",
      title: "Order Management",
      description: "View and update order statuses",
      icon: "receipt-long" as const,
      route: "/admin/orders",
      color: "#FF6B35",
      superAdminOnly: false,
    },
    {
      id: "reservations",
      title: "Reservations",
      description: "Manage table bookings",
      icon: "event-seat" as const,
      route: "/admin/reservations",
      color: "#9B59B6",
      superAdminOnly: false,
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage user accounts and profiles",
      icon: "people" as const,
      route: "/admin/users",
      color: "#4ECDC4",
      superAdminOnly: false,
    },
    {
      id: "admins",
      title: "Admin Management",
      description: "Manage admin roles and permissions",
      icon: "admin-panel-settings" as const,
      route: "/admin/admins",
      color: "#E74C3C",
      superAdminOnly: true,
    },
    {
      id: "events",
      title: "Event Management",
      description: "Create and manage events",
      icon: "event" as const,
      route: "/admin/events",
      color: "#95E1D3",
      superAdminOnly: false,
    },
    {
      id: "merch",
      title: "Merchandise",
      description: "Manage merch inventory",
      icon: "shopping-bag" as const,
      route: "/admin/merch",
      color: "#F38181",
      superAdminOnly: false,
    },
    {
      id: "giftcards",
      title: "Gift Cards",
      description: "View and manage gift cards",
      icon: "card-giftcard" as const,
      route: "/admin/giftcards",
      color: "#AA96DA",
      superAdminOnly: false,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Send push notifications",
      icon: "notifications" as const,
      route: "/admin/notifications",
      color: "#FCBAD3",
      superAdminOnly: false,
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "View sales and engagement metrics",
      icon: "analytics" as const,
      route: "/admin/analytics",
      color: "#A8D8EA",
      superAdminOnly: true,
    },
    {
      id: "delivery",
      title: "Delivery Settings",
      description: "Configure Uber Direct delivery",
      icon: "local-shipping" as const,
      route: "/admin/delivery-settings",
      color: "#FF9F43",
      superAdminOnly: false,
    },
  ];

  // Filter sections based on effective role
  const adminSections = allAdminSections.filter(
    (section) => !section.superAdminOnly || (isSuperAdmin && !viewAsAdmin)
  );

  const handleSectionPress = (route: string) => {
    console.log("Navigating to:", route);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const handleUserProfilePress = () => {
    console.log("Navigating to user profile");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(tabs)/profile" as any);
  };

  const handleToggleViewMode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewAsAdmin(!viewAsAdmin);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.loginScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginContainer}>
              <View style={styles.loginHeader}>
                <IconSymbol
                  name="admin-panel-settings"
                  size={64}
                  color={colors.primary}
                />
                <Text style={styles.loginTitle}>Admin Dashboard</Text>
                <Text style={styles.loginSubtitle}>Jagabans LA</Text>
              </View>

              <View style={styles.loginForm}>
                <View style={styles.inputContainer}>
                  <IconSymbol
                    name="person"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <Pressable onPress={togglePasswordVisibility} style={styles.eyeIconButton} disabled={loading}>
                    <IconSymbol 
                      name={showPassword ? "visibility-off" : "visibility"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && !loading && styles.loginButtonPressed,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loginButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Signing In...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.userProfileButton}
                  onPress={handleUserProfilePress}
                  disabled={loading}
                >
                  <IconSymbol
                    name="person-pin"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.userProfileButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Switch to User Profile
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Jagabans LA Management</Text>
              {isSuperAdmin && !viewAsAdmin && (
                <View style={styles.superAdminBadge}>
                  <IconSymbol name="verified" size={12} color="#FFFFFF" />
                  <Text style={styles.superAdminBadgeText}>Super Admin</Text>
                </View>
              )}
              {(isAdmin && !isSuperAdmin) || (isSuperAdmin && viewAsAdmin) ? (
                <View style={styles.adminBadge}>
                  <IconSymbol name="admin-panel-settings" size={12} color="#FFFFFF" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              style={styles.userProfileIconButton}
              onPress={handleUserProfilePress}
            >
              <IconSymbol name="person-2" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <IconSymbol name="logout" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {isSuperAdmin && (
          <View style={styles.roleSwitcherContainer}>
            <View style={styles.roleSwitcher}>
              <View style={styles.roleSwitcherLeft}>
                <IconSymbol 
                  name={viewAsAdmin ? "admin-panel-settings" : "verified"} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.roleSwitcherLabel}>
                  {viewAsAdmin ? "Viewing as Admin" : "Viewing as Super Admin"}
                </Text>
              </View>
              <Switch
                value={viewAsAdmin}
                onValueChange={handleToggleViewMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
            <Text style={styles.roleSwitcherHint}>
              {viewAsAdmin 
                ? "Toggle to view super admin features" 
                : "Toggle to preview admin view"}
            </Text>
          </View>
        )}

        {shouldShowAnalytics && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol name="shopping-cart" size={32} color={colors.primary} />
              {statsLoading ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={{ marginVertical: 8 }}
                />
              ) : (
                <Text style={styles.statValue}>{stats.totalOrders}</Text>
              )}
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="people" size={32} color="#4ECDC4" />
              {statsLoading ? (
                <ActivityIndicator
                  color="#4ECDC4"
                  style={{ marginVertical: 8 }}
                />
              ) : (
                <Text style={styles.statValue}>{stats.activeUsers}</Text>
              )}
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="attach-money" size={32} color="#95E1D3" />
              {statsLoading ? (
                <ActivityIndicator
                  color="#95E1D3"
                  style={{ marginVertical: 8 }}
                />
              ) : (
                <Text style={styles.statValue}>
                  ${(stats.revenue / 1000).toFixed(1)}K
                </Text>
              )}
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionsContainer}>
          {adminSections.map((section) => (
            <Pressable
              key={section.id}
              style={({ pressed }) => [
                styles.sectionCard,
                pressed && styles.sectionCardPressed,
              ]}
              onPress={() => handleSectionPress(section.route)}
            >
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: section.color + "20" },
                ]}
              >
                <IconSymbol
                  name={section.icon}
                  size={32}
                  color={section.color}
                />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>
                  {section.description}
                </Text>
              </View>
              <IconSymbol
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ✅ Connected to Supabase for real-time syncing
          </Text>
        </View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  loginScrollContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 600,
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  loginForm: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  eyeIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  userProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 12,
    gap: 8,
    opacity: 0.7,
  },
  userProfileButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  superAdminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userProfileIconButton: {
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleSwitcherContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleSwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleSwitcherLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  roleSwitcherHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionCardPressed: {
    opacity: 0.7,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
