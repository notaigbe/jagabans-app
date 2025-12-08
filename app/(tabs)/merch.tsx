
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { useApp } from "@/contexts/AppContext";
import Toast from "@/components/Toast";
import * as Haptics from "expo-haptics";
import { merchService } from "@/services/supabaseService";
import { MerchItem } from "@/types";

export default function MerchScreen() {
  const router = useRouter();
  const { currentColors, userProfile } = useApp();
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    loadMerchItems();
  }, []);

  const loadMerchItems = async () => {
    try {
      console.log("Loading merch items from Supabase");
      setLoading(true);
      const { data, error } = await merchService.getMerchItems();

      if (error) {
        console.error("Error loading merch items:", error);
        return;
      }

      if (data) {
        const items: MerchItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          pointsCost: item.points_cost,
          image: item.image,
          inStock: item.in_stock,
        }));
        setMerchItems(items);
        console.log("Loaded", items.length, "merch items");
      }
    } catch (error) {
      console.error("Exception loading merch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: MerchItem) => {
    console.log("Merch item pressed:", item.name);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: "/merch-redemption",
      params: {
        id: item.id,
        name: item.name,
        description: item.description,
        pointsCost: item.pointsCost.toString(),
        image: item.image,
        inStock: item.inStock.toString(),
      },
    });
  };

  const handleRedeemPress = (item: MerchItem, event: any) => {
    event.stopPropagation();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userPoints = userProfile?.points || 0;
    if (userPoints < item.pointsCost) {
      showToast(
        "error",
        `Insufficient points. You need ${
          item.pointsCost - userPoints
        } more points.`
      );
      // setToastVisible(true);
      return;
    }

    // Proceed to redemption screen
    handleItemPress(item);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: currentColors.background }]}
      edges={["top"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: currentColors.text }]}>
            Merch Store
          </Text>
          <View style={styles.pointsContainer}>
            <IconSymbol
              name="star.fill"
              size={20}
              color={currentColors.secondary}
            />
            <Text style={[styles.pointsText, { color: currentColors.text }]}>
              {userProfile?.points || 0} pts
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.secondary} />
            <Text
              style={[
                styles.loadingText,
                { color: currentColors.textSecondary },
              ]}
            >
              Loading merch...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.subtitle, { color: currentColors.textSecondary }]}
            >
              Redeem your points for exclusive Jagabans LA merchandise
            </Text>

            {merchItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  name="shopping-bag"
                  size={64}
                  color={currentColors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  No merch items available
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {merchItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.merchCard,
                      { backgroundColor: currentColors.card },
                    ]}
                    onPress={() => handleItemPress(item)}
                    disabled={!item.inStock}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.merchImage}
                    />
                    {!item.inStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                      </View>
                    )}
                    <View style={styles.merchInfo}>
                      <Text
                        style={[
                          styles.merchName,
                          { color: currentColors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.merchDescription,
                          { color: currentColors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                      <View style={styles.merchFooter}>
                        <View style={styles.pointsCostContainer}>
                          <IconSymbol
                            name="star.fill"
                            size={16}
                            color={currentColors.secondary}
                          />
                          <Text
                            style={[
                              styles.pointsCost,
                              { color: currentColors.secondary },
                            ]}
                          >
                            {item.pointsCost}
                          </Text>
                        </View>
                        {item.inStock && (
                          <Pressable
                            style={[
                              styles.redeemButton,
                              { backgroundColor: currentColors.secondary },
                            ]}
                            onPress={(e) => handleRedeemPress(item, e)}
                          >
                            <Text
                              style={[
                                styles.redeemButtonText,
                                { color: currentColors.card },
                              ]}
                            >
                              Redeem
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type={toastType}
        currentColors={currentColors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  merchCard: {
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  merchImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  merchInfo: {
    padding: 12,
  },
  merchName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  merchDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  merchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsCostContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: "bold",
  },
  redeemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  redeemButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
