
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";
import Toast from "@/components/Toast";
import { ActivityIndicator } from "react-native";
import { supabase } from "@/app/integrations/supabase/client";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const router = useRouter();
  const { currentColors, userProfile } = useApp();
  const { isAuthenticated, signIn, signUp, signOut } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (userProfile?.profileImage) {
        setImageLoading(true);
        try {
          // Check if it's already a full URL
          if (userProfile.profileImage.startsWith("http")) {
            setProfileImageUrl(userProfile.profileImage);
          } else {
            // Fetch from Supabase storage
            const { data } = supabase.storage
              .from("profile/avatars")
              .getPublicUrl(userProfile.profileImage);
            if (data?.publicUrl) {
              setProfileImageUrl(data.publicUrl);
            }
          }
        } catch (error) {
          console.error("Failed to load profile image:", error);
          showToast("error", "Could not load profile picture");
        } finally {
          setImageLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchProfileImage();
    }
  }, [userProfile?.profileImage, isAuthenticated]);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleAuth = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!email || !password) {
      showToast("error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
          showToast("error", "Please enter your name");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, phone);
        if (!error) {
          // Clear form after successful signup
          setEmail("");
          setPassword("");
          setName("");
          setPhone("");
          // Switch to sign in mode
          setIsSignUp(false);
          setShowPassword(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          // Clear form after successful sign in
          setEmail("");
          setPassword("");
          setShowPassword(false);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            // Clear any form data
            setEmail("");
            setPassword("");
            setName("");
            setPhone("");
            setIsSignUp(false);
            setShowPassword(false);
          } catch (error) {
            console.error("Sign out error:", error);
            showToast("error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleMenuPress = (route: string) => {
    console.log("Navigating to:", route);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView
          style={styles.safeArea}
          edges={["top"]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.authContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.authHeader}>
                <IconSymbol
                  name="person.circle.fill"
                  size={80}
                  color={currentColors.primary}
                />
                <Text style={[styles.authTitle, { color: currentColors.text }]}>
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </Text>
                <Text
                  style={[
                    styles.authSubtitle,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  {isSignUp
                    ? "Sign up to start earning points"
                    : "Sign in to your account"}
                </Text>
              </View>

              <View style={styles.authForm}>
                {isSignUp && (
                  <LinearGradient
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.inputContainer,
                      { borderColor: currentColors.border },
                    ]}
                  >
                    <IconSymbol
                      name="person"
                      size={20}
                      color={currentColors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: currentColors.text }]}
                      placeholder="Full Name"
                      placeholderTextColor={currentColors.textSecondary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </LinearGradient>
                )}

                <LinearGradient
                  colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.inputContainer,
                    { borderColor: currentColors.border },
                  ]}
                >
                  <IconSymbol
                    name="envelope"
                    size={20}
                    color={currentColors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: currentColors.text }]}
                    placeholder="Email"
                    placeholderTextColor={currentColors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </LinearGradient>

                <LinearGradient
                  colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.inputContainer,
                    { borderColor: currentColors.border },
                  ]}
                >
                  <IconSymbol
                    name="lock"
                    size={20}
                    color={currentColors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: currentColors.text }]}
                    placeholder="Password"
                    placeholderTextColor={currentColors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => {
                      setShowPassword(!showPassword);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol
                      name={showPassword ? "eye.slash.fill" : "eye.fill"}
                      size={20}
                      color={currentColors.textSecondary}
                    />
                  </Pressable>
                </LinearGradient>

                {isSignUp && (
                  <LinearGradient
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.inputContainer,
                      { borderColor: currentColors.border },
                    ]}
                  >
                    <IconSymbol
                      name="phone"
                      size={20}
                      color={currentColors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: currentColors.text }]}
                      placeholder="Phone (optional)"
                      placeholderTextColor={currentColors.textSecondary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </LinearGradient>
                )}

                <LinearGradient
                  colors={[currentColors.primary, currentColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.authButton,
                    { opacity: loading ? 0.6 : 1 },
                  ]}
                >
                  <Pressable
                    style={styles.authButtonInner}
                    onPress={handleAuth}
                    disabled={loading}
                  >
                    <Text
                      style={[styles.authButtonText, { color: currentColors.card }]}
                    >
                      {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
                    </Text>
                  </Pressable>
                </LinearGradient>

                <Pressable
                  style={styles.switchButton}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    // Clear form when switching
                    setEmail("");
                    setPassword("");
                    setName("");
                    setPhone("");
                    setShowPassword(false);
                  }}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.switchButtonText,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    {isSignUp
                      ? "Already have an account? "
                      : "Don't have an account? "}
                    <Text
                      style={{ color: currentColors.primary, fontWeight: "600" }}
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </Text>
                  </Text>
                </Pressable>
                {/* Admin Access Link */}
                <Pressable
                  style={styles.adminButton}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    handleMenuPress("/admin");
                  }}
                  disabled={loading}
                >
                  <IconSymbol
                    name="admin-panel-settings"
                    size={16}
                    color={currentColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.adminButtonText,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    Admin Dashboard
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={["top"]}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
        >
          {/* Profile Header with Gradient */}
          <LinearGradient
            colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <View style={styles.profileImageContainer}>
              {imageLoading ? (
                <View
                  style={[
                    styles.profileImagePlaceholder,
                    { backgroundColor: currentColors.primary + "20" },
                  ]}
                >
                  <ActivityIndicator size="large" color={currentColors.primary} />
                </View>
              ) : profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.profileImage}
                  onError={(error) => {
                    console.error("Image load error:", error);
                    setProfileImageUrl(null);
                  }}
                />
              ) : (
                <LinearGradient
                  colors={[currentColors.primary, currentColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.profileImagePlaceholder}
                >
                  <IconSymbol
                    name="person"
                    size={48}
                    color={currentColors.card}
                  />
                </LinearGradient>
              )}
              <LinearGradient
                colors={[currentColors.primary, currentColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editImageButton}
              >
                <Pressable
                  style={styles.editImageButtonInner}
                  onPress={() => handleMenuPress("/edit-profile")}
                >
                  <IconSymbol name="camera" size={16} color={currentColors.card} />
                </Pressable>
              </LinearGradient>
            </View>
            <Text style={[styles.profileName, { color: currentColors.text }]}>
              {userProfile?.name}
            </Text>
            <Text
              style={[
                styles.profileEmail,
                { color: currentColors.textSecondary },
              ]}
            >
              {userProfile?.email}
            </Text>

            <View style={styles.pointsCard}>
              <IconSymbol
                name="star.fill"
                size={32}
                color={currentColors.primary}
              />
              <View style={styles.pointsInfo}>
                <Text style={[styles.pointsValue, { color: currentColors.text }]}>
                  {userProfile?.points || 0}
                </Text>
                <Text
                  style={[
                    styles.pointsLabel,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  Points Available
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Menu Options */}
          <View style={styles.menuSection}>
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuItem}
            >
              <Pressable
                style={styles.menuItemInner}
                onPress={() => handleMenuPress("/order-history")}
              >
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: currentColors.primary + "20" },
                  ]}
                >
                  <IconSymbol
                    name="receipt-long"
                    size={24}
                    color={currentColors.primary}
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: currentColors.text }]}>
                    Order History
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    {userProfile?.orders?.length || 0} orders
                  </Text>
                </View>
                <IconSymbol
                  name="chevron-right"
                  size={24}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuItem}
            >
              <Pressable
                style={styles.menuItemInner}
                onPress={() => handleMenuPress("/payment-methods")}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: "#4ECDC4" + "20" }]}
                >
                  <IconSymbol name="credit-card" size={24} color="#4ECDC4" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: currentColors.text }]}>
                    Payment Methods
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    {userProfile?.paymentMethods?.length || 0} cards
                  </Text>
                </View>
                <IconSymbol
                  name="chevron-right"
                  size={24}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuItem}
            >
              <Pressable
                style={styles.menuItemInner}
                onPress={() => handleMenuPress("/events")}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: "#95E1D3" + "20" }]}
                >
                  <IconSymbol name="event" size={24} color="#95E1D3" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: currentColors.text }]}>
                    Events
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    View upcoming events
                  </Text>
                </View>
                <IconSymbol
                  name="chevron-right"
                  size={24}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuItem}
            >
              <Pressable
                style={styles.menuItemInner}
                onPress={() => handleMenuPress("/theme-settings")}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: "#F38181" + "20" }]}
                >
                  <IconSymbol name="palette" size={24} color="#F38181" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: currentColors.text }]}>
                    Theme Settings
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    Customize appearance
                  </Text>
                </View>
                <IconSymbol
                  name="chevron-right"
                  size={24}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuItem}
            >
              <Pressable
                style={styles.menuItemInner}
                onPress={handleSignOut}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: "#FF6B6B" + "20" }]}
                >
                  <IconSymbol name="logout" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: "#FF6B6B" }]}>
                    Sign Out
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: currentColors.textSecondary },
                    ]}
                  >
                    Sign out of your account
                  </Text>
                </View>
                <IconSymbol
                  name="chevron-right"
                  size={24}
                  color={currentColors.textSecondary}
                />
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  authContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  authHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  authSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  authForm: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    boxShadow: '0px 6px 20px rgba(212, 175, 55, 0.25)',
    elevation: 6,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  authButton: {
    borderRadius: 12,
    marginTop: 8,
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.4)',
    elevation: 8,
  },
  authButtonInner: {
    paddingVertical: 16,
    alignItems: "center",
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 24,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 14,
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  demoText: {
    fontSize: 12,
    textAlign: "center",
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 12,
    gap: 8,
    opacity: 0.7,
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
    elevation: 6,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
    elevation: 6,
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.4)',
    elevation: 6,
  },
  editImageButtonInner: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 24,
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pointsInfo: {
    alignItems: "flex-start",
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  pointsLabel: {
    fontSize: 14,
  },
  menuSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    borderRadius: 16,
    boxShadow: "0px 6px 20px rgba(212, 175, 55, 0.25)",
    elevation: 6,
  },
  menuItemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
});
