
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
  "Online Special",
  "Online Appetizers",
  "Online Jollof Combos",
  "Online Beverages",
  "Online Sides",
  "Online Soups x Dips",
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
  const [selectedCategory, setSelectedCategory] = useState("All");
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
    <LinearGradient
      colors={['#0D1A2B', '#1A2838', '#2A3848', '#3A4858', '#4A5868', '#5A6878', '#D4AF37']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Header with Dark Green Background */}
      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {headerImage ? (
                <Image 
                  source={{ uri: headerImage }} 
                  style={styles.logo}
                  tintColor="#5FE8D0"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>
                    Jagabans
                  </Text>
                  <Text style={styles.logoSubtext}>
                    LOS ANGELES
                  </Text>
                </View>
              )}
            </View>
            <Pressable 
              onPress={() => router.push("/notifications")}
              style={styles.notificationButton}
            >
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={28}
                color="#FFFFFF"
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                  backgroundColor: selectedCategory === category ? '#F5A623' : '#1A3A2E',
                  borderColor: selectedCategory === category ? '#F5A623' : '#4AD7C2',
                  paddingHorizontal: getResponsivePadding(16),
                  paddingVertical: getResponsivePadding(10),
                },
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category ? '#1A5A3E' : '#FFFFFF',
                    fontSize: getResponsiveFontSize(13),
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

        {/* Online Special Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Online Special
          </Text>
          <View style={styles.divider} />
        </View>

        {/* Menu Items */}
        {loading || menuItems.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5FE8D0" />
            <Text style={styles.loadingText}>
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
                  style={styles.menuItem}
                  onPress={() => handleItemPress(item.id)}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.menuItemImage}
                    />
                  </View>
                  <View style={styles.menuItemInfoWrapper}>
                    {/* Texture overlay */}
                    <View style={styles.textureOverlay} />
                    <LinearGradient
                      colors={['rgba(26, 58, 46, 0.85)', 'rgba(26, 58, 46, 0.85)', 'rgba(26, 58, 46, 0.85)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.menuItemInfo}
                    >
                      <Text style={styles.menuItemName}>
                        {item.name}
                      </Text>
                      <Text
                        style={styles.menuItemDescription}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                      <View style={styles.menuItemFooter}>
                        <Text style={styles.menuItemPrice}>
                          ${item.price.toFixed(2)}
                        </Text>
                        <Pressable
                          style={styles.addButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                        >
                          <IconSymbol
                            name="plus"
                            size={20}
                            color="#5FE8D0"
                          />
                        </Pressable>
                      </View>
                    </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    backgroundColor: '#0D1A2B',
    paddingBottom: 20,
  },
  headerSafeArea: {
    width: '100%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 70,
    resizeMode: "contain",
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_900Black',
    letterSpacing: 3,
    fontStyle: 'italic',
    color: '#5FE8D0',
  },
  logoSubtext: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 5,
    marginTop: -2,
    color: '#5FE8D0',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#D4AF37',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
    color: '#0D1A2B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: 20,
    marginTop: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  categoryButton: {
    borderRadius: 12,
    marginRight: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  categoryText: {
    fontWeight: "600",
    textAlign: "center",
    fontFamily: 'Inter_600SemiBold',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 1,
    marginBottom: 16,
    color: '#5FE8D0',
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: '#5FE8D0',
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
    color: '#B0B8C1',
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
    borderRadius: 16,
    marginBottom: 28,
    overflow: "hidden",
    boxShadow: "0px 8px 24px rgba(212, 175, 55, 0.5)",
    elevation: 8,
    backgroundColor: '#1A3A2E',
  },
  imageContainer: {
    width: "100%",
    height: 260,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  menuItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'cover',
  },
  menuItemInfoWrapper: {
    position: 'relative',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.15,
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.05) 2px, rgba(255,255,255,.05) 4px)',
  },
  menuItemInfo: {
    padding: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  menuItemName: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 10,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  menuItemDescription: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemPrice: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#5FE8D0',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 12px rgba(212, 175, 55, 0.6)",
    elevation: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5FE8D0',
  },
});
