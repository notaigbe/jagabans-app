
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { imageService } from "@/services/supabaseService";
import Toast from "@/components/Toast";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const menuCategories = [
  "All",
  "Online Appetizers",
  "Online Beverages",
  "Online Desserts",
  "Online Jollof Combos",
  "Online White Rice Combos",
  "Online Soups x Dips",
  "Online Special",
  "Online Sides",
];

// Responsive font size calculation
const getResponsiveFontSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = baseSize * scale;
  return Math.round(newSize);
};

// Responsive padding calculation
const getResponsivePadding = (basePadding: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newPadding = basePadding * scale;
  return Math.max(Math.round(newPadding), basePadding * 0.8);
};

export default function HomeScreen() {
  const router = useRouter();
  const { currentColors, menuItems, loadMenuItems, addToCart, getUnreadNotificationCount } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("Online Special");
  const [loading, setLoading] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const unreadCount = getUnreadNotificationCount();

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    async function fetchHeaderImage() {
      try {
        const imageUrl = imageService.getPublicUrl(
          "assets",
          "logos/jagaban_web_logo_dark.png"
        );
        setHeaderImage(imageUrl);
      } catch (error) {
        console.error("Failed to load header image:", error);
      }
    }

    fetchHeaderImage();
  }, []);

  useEffect(() => {
    // Only load if menuItems is empty
    if (menuItems.length === 0) {
      setLoading(true);
      loadMenuItems().finally(() => setLoading(false));
    }
  }, [menuItems.length, loadMenuItems]);

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleCategoryPress = (category: string) => {
    console.log("Category selected:", category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleItemPress = (itemId: string) => {
    console.log("Item pressed:", itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/item-detail?id=${itemId}`);
  };

  const handleAddToCart = (item: any) => {
    console.log("Adding to cart:", item.name, 1);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ ...item, quantity: 1 });
    showToast("success", `1 ${item.name} Added to cart`);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#0D1A2B', '#1A2838', '#2A3848', '#D4AF37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {headerImage ? (
                <Image source={{ uri: headerImage }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={[styles.logoText, { color: currentColors.primary }]}>
                    JAGABANS
                  </Text>
                  <Text style={[styles.logoSubtext, { color: currentColors.secondary }]}>
                    LOS ANGELES
                  </Text>
                </View>
              )}
            </View>
            <Pressable 
              onPress={() => router.push("/notifications")}
              style={styles.menuButton}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: currentColors.secondary }]}>
                  <Text style={[styles.notificationBadgeText, { color: currentColors.background }]}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Online Special Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentColors.primary }]}>
            Online Special
          </Text>
          <View style={[styles.divider, { backgroundColor: currentColors.secondary }]} />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {menuCategories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: currentColors.card,
                  borderColor: currentColors.border,
                  paddingHorizontal: getResponsivePadding(16),
                  paddingVertical: getResponsivePadding(10),
                },
                selectedCategory === category && {
                  backgroundColor: currentColors.secondary,
                  borderColor: currentColors.secondary,
                },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: currentColors.text,
                    fontSize: getResponsiveFontSize(13),
                  },
                  selectedCategory === category && {
                    color: currentColors.background,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Menu Items */}
        {loading || menuItems.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.secondary} />
            <Text
              style={[
                styles.loadingText,
                { color: currentColors.textSecondary },
              ]}
            >
              Loading menu...
            </Text>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  name="restaurant"
                  size={64}
                  color={currentColors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  No items in this category
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.menuItem,
                    { backgroundColor: currentColors.card },
                  ]}
                  onPress={() => handleItemPress(item.id)}
                >
                  <View style={[styles.imageContainer, { borderColor: currentColors.border }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.menuItemImage}
                    />
                    <View style={styles.imageOverlay} />
                  </View>
                  <View style={styles.menuItemInfo}>
                    <Text
                      style={[
                        styles.menuItemName,
                        { color: currentColors.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.menuItemDescription,
                        { color: currentColors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                    <View style={styles.menuItemFooter}>
                      <Text
                        style={[
                          styles.menuItemPrice,
                          { color: currentColors.secondary },
                        ]}
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                      <Pressable
                        style={[
                          styles.addButton,
                          { backgroundColor: currentColors.secondary },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <IconSymbol
                          name="plus"
                          size={20}
                          color={currentColors.background}
                        />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={currentColors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerSafeArea: {
    width: '100%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: "contain",
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_900Black',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 4,
    marginTop: -4,
  },
  menuButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    backgroundColor: '#D4AF37',
    marginVertical: 3,
    borderRadius: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  divider: {
    width: 80,
    height: 1,
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  categoryText: {
    fontWeight: "600",
    textAlign: "center",
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuItem: {
    borderRadius: 0,
    marginBottom: 24,
    overflow: "hidden",
    boxShadow: "0px 4px 16px rgba(212, 175, 55, 0.15)",
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 240,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  menuItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  menuItemInfo: {
    padding: 20,
  },
  menuItemName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    lineHeight: 22,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemPrice: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 2px 8px rgba(212, 175, 55, 0.3)",
    elevation: 3,
  },
});
