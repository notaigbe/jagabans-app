
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
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { imageService } from "@/services/supabaseService";
import Toast from "@/components/Toast";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const menuCategories = [
  "All",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryScrollY = useRef(0);
  
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
          "/loogo/peppered-goat-logo.jpg"
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

  const filteredItems = menuItems.filter((item) => {
    // Filter by search query
    const matchesSearch = searchQuery.trim() === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
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

  const handleClearSearch = () => {
    console.log("Clearing search");
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Collapse categories when scrolled past them (approximately 80px)
    if (currentScrollY > 80 && !categoriesCollapsed) {
      setCategoriesCollapsed(true);
    } else if (currentScrollY <= 80 && categoriesCollapsed) {
      setCategoriesCollapsed(false);
    }
  };

  const toggleCategoryDropdown = () => {
    console.log("Toggle category dropdown");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  return (
    <View
      style={styles.container}
    >
      {/* Header with Gradient and 3% Translucency - Background Only */}
      <View style={styles.headerContainer}>
        {/* Translucent Background Layer */}
        <View
          style={styles.headerBackground}
        />
        
        {/* Content Layer (Logo and Notification Bell) - Fully Opaque */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {headerImage ? (
                <Image 
                  source={{ uri: headerImage }} 
                  style={styles.logo}
                  tintColor="#000000"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>
                    The Peppered Goat
                  </Text>
                  <Text style={styles.logoSubtext}>
                    STUBBORNLY SPICY
                  </Text>
                </View>
              )}
            </View>
            <Pressable 
              onPress={() => router.push("/notifications")}
              style={styles.notificationButton}
            >
              <IconSymbol
                name={Platform.OS === 'ios' ? "bell.fill" : "notifications"}
                size={28}
                color="#000000"
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

      {/* Search Bar with Category Dropdown */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <IconSymbol
            name={Platform.OS === 'ios' ? "magnifyingglass" : "search"}
            size={20}
            color="#999999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} style={styles.clearButton}>
              <IconSymbol
                name={Platform.OS === 'ios' ? "xmark.circle.fill" : "cancel"}
                size={20}
                color="#999999"
              />
            </Pressable>
          )}
          
          {/* Category Dropdown Button (visible when collapsed) */}
          {categoriesCollapsed && (
            <Pressable 
              onPress={toggleCategoryDropdown}
              style={styles.categoryDropdownButton}
            >
              <IconSymbol
                name={Platform.OS === 'ios' ? "line.3.horizontal.decrease.circle.fill" : "filter-list"}
                size={28}
                color="#000000"
              />
            </Pressable>
          )}
        </View>
      </View>

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
                  name={Platform.OS === 'ios' ? "xmark.circle.fill" : "cancel"}
                  size={24}
                  color="#999999"
                />
              </Pressable>
            </View>
            <ScrollView style={styles.dropdownScroll}>
              {menuCategories.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.dropdownItemSelected
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === category && styles.dropdownItemTextSelected
                    ]}
                  >
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <IconSymbol
                      name={Platform.OS === 'ios' ? "checkmark.circle.fill" : "check-circle"}
                      size={20}
                      color="#000000"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Categories - Hidden when collapsed */}
        {!categoriesCollapsed && (
          <View style={styles.categoriesWrapper}>
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
                    backgroundColor: selectedCategory === category ? '#000000' : '#2A2A2A',
                    borderColor: selectedCategory === category ? '#E26F5B' : '#3A3A3A',
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
                      color: selectedCategory === category ? '#FFFFFF' : '#AAAAAA',
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
    
    {/* Left fade overlay */}
    <View
      pointerEvents="none"
      style={styles.categoryFadeLeft}
    />
    
    {/* Right fade overlay */}
    <View
      pointerEvents="none"
      style={styles.categoryFadeRight}
    />
  </View>
)}

        {/* Menu Items */}
        {loading || menuItems.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>
              Loading menu...
            </Text>
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  name={Platform.OS === 'ios' ? "magnifyingglass" : "search"}
                  size={64}
                  color={currentColors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  {searchQuery ? 'No items match your search' : 'No items in this category'}
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
                    <View
                      style={styles.menuItemInfo}
                    >
                      <Text style={styles.menuItemName}>
                        {item.name}
                      </Text>
                      <Text
                        style={styles.menuItemDescription}
                        numberOfLines={3}
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
                            name={Platform.OS === 'ios' ? "plus" : "add"}
                            size={20}
                            color="#000000"
                          />
                        </Pressable>
                      </View>
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
    backgroundColor: '#1A1A1A',
  },
  headerContainer: {
    position: 'relative',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 4,
    backgroundColor: '#1A1A1A',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A1A',
  },
  headerSafeArea: {
    width: '100%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
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
    color: '#FFFFFF',
  },
  logoSubtext: {
    fontSize: 10,
    fontFamily: 'LibertinusSans_400Regular',
    letterSpacing: 5,
    marginTop: -2,
    color: '#FFFFFF',
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
    backgroundColor: '#E26F5B',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 0.2,
    borderColor: '#00BC7D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
    color: '#888888',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'LibertinusSans_400Regular',
    color: '#FFFFFF',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  categoryDropdownButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: '#00BC7D',
    maxHeight: 400,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  dropdownTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#FFFFFF',
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
    borderBottomColor: '#3A3A3A',
  },
  dropdownItemSelected: {
    backgroundColor: '#3A3A3A',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#AAAAAA',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'LibertinusSans_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  categoriesContainer: {
    maxHeight: 60,
    // borderTopColor: '#00BC7D',
    // borderTopWidth: 0.2,
    borderBottomColor: '#00BC7D',
    borderBottomWidth: 0.2,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  categoryButton: {
    borderRadius: 8,
    marginRight: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    elevation: 2,
    borderColor: '#00BC7D',
    backgroundColor: '#F5F5F5',
  },
  categoryGradient: {
    borderRadius: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
    backgroundColor: '#000000',
  },
  categoryText: {
    fontWeight: "600",
    textAlign: "center",
    fontFamily: 'LibertinusSans_700Bold',
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
    fontFamily: 'LibertinusSans_400Regular',
    color: '#AAAAAA',
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
    fontFamily: 'LibertinusSans_400Regular',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuItem: {
    borderRadius: 0,
    marginBottom: 28,
    overflow: "hidden",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
    elevation: 4,
    backgroundColor: '#2A2A2A',
    borderWidth: 0.2,
    borderColor: '#00BC7D',
  },
  imageContainer: {
    width: "100%",
    height: 260,
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
  },
  menuItemName: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 10,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 18,
    lineHeight: 24,
    color: '#AAAAAA',
    // letterSpacing: 0.01,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemPrice: {
    fontSize: 24,
    fontFamily: 'LibertinusSans_700Bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: '#f8cbb1',
    borderWidth: 1,
    borderColor: '#E26F5B',
  },
  categoriesWrapper: {
    position: 'relative',
    marginBottom: 12,
    marginTop: 12,
  },
  categoryFadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
  },
  categoryFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.9), transparent)',
  },
});
