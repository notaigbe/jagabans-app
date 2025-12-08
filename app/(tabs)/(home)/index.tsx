
import { useState, useEffect, useRef } from "react";
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
  TextInput,
  Animated,
  Modal,
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarSticky = useRef(new Animated.Value(0)).current;
  
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

  // Handle scroll animations
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      // Make search bar sticky when scrolling down past 50px
      if (value > 50) {
        Animated.timing(searchBarSticky, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.timing(searchBarSticky, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, searchBarSticky]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryPress = (category: string) => {
    console.log("Category selected:", category);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
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
      {/* Fixed Header */}
      <View style={styles.headerBackground}>
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
                <View style={[styles.notificationBadge, { backgroundColor: currentColors.primary }]}>
                  <Text style={[styles.notificationBadgeText, { color: currentColors.background }]}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Sticky Search Bar - positioned below header */}
      <Animated.View 
        style={[
          styles.stickySearchContainer,
          {
            top: searchBarSticky.interpolate({
              inputRange: [0, 1],
              outputRange: [120, 0],
            }),
          }
        ]}
      >
        <SafeAreaView edges={searchBarSticky.interpolate({
          inputRange: [0, 1],
          outputRange: [[], ['top']],
        }) as any} style={styles.searchSafeArea}>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBarContainer}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color="#B0B8C1"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                placeholderTextColor="#B0B8C1"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color="#B0B8C1"
                  />
                </Pressable>
              )}
            </View>
            
            {/* Category Dropdown Button (visible when sticky) */}
            <Animated.View
              style={{
                opacity: searchBarSticky,
                width: searchBarSticky.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 50],
                }),
                overflow: 'hidden',
              }}
            >
              <Pressable
                style={styles.categoryDropdownButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCategoryDropdown(!showCategoryDropdown);
                }}
              >
                <IconSymbol
                  ios_icon_name="line.3.horizontal.decrease.circle"
                  android_material_icon_name="filter_list"
                  size={24}
                  color="#5FE8D0"
                />
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Category Dropdown Modal */}
      <Modal
        visible={showCategoryDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Categories</Text>
              <Pressable onPress={() => setShowCategoryDropdown(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={24}
                  color="#5FE8D0"
                />
              </Pressable>
            </View>
            <ScrollView style={styles.dropdownScroll}>
              {menuCategories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === category && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color="#F5A623"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Categories - Below search bar when at top, hidden when sticky */}
        <Animated.View
          style={{
            opacity: searchBarSticky.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            height: searchBarSticky.interpolate({
              inputRange: [0, 1],
              outputRange: [80, 0],
            }),
            overflow: 'hidden',
          }}
        >
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
                  selectedCategory === category && {
                    color: currentColors.background,
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
        </Animated.View>

        {/* Menu Items */}
        {loading || menuItems.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
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
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search_off"
                  size={64}
                  color="#B0B8C1"
                />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No items match your search" : "No items in this category"}
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
                  <LinearGradient
                    colors={['rgba(26, 40, 56, 0.85)', 'rgba(26, 40, 56, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.menuItemInfo}
                  >
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
                          { color: currentColors.primary },
                        ]}
                      >
                        ${item.price.toFixed(2)}
                      </Text>
                      <Pressable
                        style={[styles.addButton, { backgroundColor: currentColors.card }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <IconSymbol
                          ios_icon_name="plus"
                          android_material_icon_name="add"
                          size={20}
                          color="#5FE8D0"
                        />
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))
            )}
          </View>
        )}
      </Animated.ScrollView>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0D1A2B',
    height: 120,
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
  stickySearchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#0D1A2B',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  searchSafeArea: {
    width: '100%',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2838',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4AD7C2',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  categoryDropdownButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1A2838',
    borderWidth: 2,
    borderColor: '#4AD7C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  dropdownContainer: {
    backgroundColor: '#1A2838',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: 400,
    borderWidth: 2,
    borderColor: '#4AD7C2',
    boxShadow: '0px 8px 24px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4AD7C2',
  },
  dropdownTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#5FE8D0',
  },
  dropdownScroll: {
    maxHeight: 320,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 215, 194, 0.2)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  dropdownItemTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: '#F5A623',
  },
  scrollView: {
    flex: 1,
    marginTop: 190,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 0,
  },
  categoriesContainer: {
    maxHeight: 80,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    borderRadius: 20,
    borderColor: '#ccccccff',
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
    color: '#B0B8C1',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuItem: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    boxShadow: "0px 4px 16px rgba(74, 215, 194, 0.15)",
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 240,
    borderRadius: 16,
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
    padding: 16,
    borderRadius: 16,
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
    boxShadow: "0px 2px 8px rgba(215, 194, 74, 0.3)",
    elevation: 3,
  },
});
