
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

const giftCardAmounts = [25, 50, 75, 100, 150, 200];
const pointsAmounts = [100, 250, 500, 750, 1000, 1500];

export default function GiftCardsScreen() {
  const { purchaseGiftCard, sendPointsGiftCard, userProfile, currentColors } =
    useApp();
  const [giftType, setGiftType] = useState<"money" | "points">("money");
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [selectedPoints, setSelectedPoints] = useState(250);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");

  const userPoints = userProfile?.points || 0;

  const handleAmountSelect = (amount: number) => {
    console.log("Amount selected:", amount);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAmount(amount);
  };

  const handlePointsSelect = (points: number) => {
    console.log("Points selected:", points);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPoints(points);
  };

  const handlePurchase = () => {
    console.log("Purchasing gift card");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!recipientEmail && !recipientName) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (giftType === "money") {
      const giftCard = {
        id: Date.now().toString(),
        amount: selectedAmount,
        recipientEmail,
        recipientName,
        message,
        type: "money" as const,
      };

      purchaseGiftCard(giftCard);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Gift Card Purchased!",
        `A $${selectedAmount} gift card has been sent to ${recipientName} at ${recipientEmail}`,
        [{ text: "OK" }]
      );
    } else {
      if (!recipientId.trim()) {
        Alert.alert(
          "Missing Information",
          "Please enter the recipient&apos;s user ID."
        );
        return;
      }

      if (userPoints < selectedPoints) {
        Alert.alert(
          "Insufficient Points",
          `You need ${
            selectedPoints - userPoints
          } more points to send this gift.`
        );
        return;
      }

      sendPointsGiftCard(recipientId, recipientName, selectedPoints, message);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Points Gift Card Sent!",
        `${selectedPoints} points have been sent to ${recipientName}!`,
        [{ text: "OK" }]
      );
    }

    setRecipientEmail("");
    setRecipientName("");
    setRecipientId("");
    setMessage("");
  };

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
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>
              Gift Cards
            </Text>
            <View style={styles.headerRight}>
              <IconSymbol
                name="gift.fill"
                size={28}
                color={currentColors.primary}
              />
              <LinearGradient
                colors={[currentColors.secondary, currentColors.highlight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pointsBadge}
              >
                <IconSymbol
                  name="star.fill"
                  size={14}
                  color={currentColors.background}
                />
                <Text style={[styles.pointsText, { color: currentColors.background }]}>
                  {userPoints}
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: currentColors.textSecondary },
              ]}
            >
              Share the love of authentic Nigerian cuisine
            </Text>

            {/* Gift Type Selection */}
            <View style={styles.typeSelector}>
              <LinearGradient
                colors={giftType === "money" ? [currentColors.secondary, currentColors.highlight] : [currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.typeButton,
                  { borderColor: currentColors.border },
                ]}
              >
                <Pressable
                  style={styles.typeButtonInner}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setGiftType("money");
                  }}
                >
                  <IconSymbol
                    name="dollarsign.circle.fill"
                    size={24}
                    color={
                      giftType === "money" ? currentColors.background : currentColors.text
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: giftType === "money" ? currentColors.background : currentColors.text },
                    ]}
                  >
                    Money Gift Card
                  </Text>
                </Pressable>
              </LinearGradient>
              <LinearGradient
                colors={giftType === "points" ? [currentColors.secondary, currentColors.highlight] : [currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.typeButton,
                  { borderColor: currentColors.border },
                ]}
              >
                <Pressable
                  style={styles.typeButtonInner}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setGiftType("points");
                  }}
                >
                  <IconSymbol
                    name="star.fill"
                    size={24}
                    color={
                      giftType === "points"
                        ? currentColors.background
                        : currentColors.text
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: giftType === "points" ? currentColors.background : currentColors.text },
                    ]}
                  >
                    Points Gift Card
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>

            {/* Amount/Points Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: currentColors.text }]}>
                {giftType === "money" ? "Select Amount" : "Select Points"}
              </Text>
              <View style={styles.amountGrid}>
                {(giftType === "money" ? giftCardAmounts : pointsAmounts).map(
                  (value) => (
                    <LinearGradient
                      key={value}
                      colors={(giftType === "money"
                        ? selectedAmount === value
                        : selectedPoints === value) ? [currentColors.secondary, currentColors.highlight] : [currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.amountButton,
                        { borderColor: currentColors.border },
                      ]}
                    >
                      <Pressable
                        style={styles.amountButtonInner}
                        onPress={() =>
                          giftType === "money"
                            ? handleAmountSelect(value)
                            : handlePointsSelect(value)
                        }
                      >
                        <Text
                          style={[
                            styles.amountText,
                            { color: (giftType === "money"
                              ? selectedAmount === value
                              : selectedPoints === value) ? currentColors.background : currentColors.text },
                          ]}
                        >
                          {giftType === "money" ? `$${value}` : `${value} pts`}
                        </Text>
                      </Pressable>
                    </LinearGradient>
                  )
                )}
              </View>
            </View>

            {/* Recipient Information */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: currentColors.text }]}>
                Recipient Name *
              </Text>
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.inputWrapper, { borderColor: currentColors.border }]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: currentColors.text,
                    },
                  ]}
                  placeholder="Enter recipient's name"
                  placeholderTextColor={currentColors.textSecondary}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </LinearGradient>
            </View>

            {giftType === "money" ? (
              <View style={styles.section}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Recipient Email *
                </Text>
                <LinearGradient
                  colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputWrapper, { borderColor: currentColors.border }]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: currentColors.text,
                      },
                    ]}
                    placeholder="Enter recipient's email"
                    placeholderTextColor={currentColors.textSecondary}
                    value={recipientEmail}
                    onChangeText={setRecipientEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  Recipient User ID *
                </Text>
                <LinearGradient
                  colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputWrapper, { borderColor: currentColors.border }]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: currentColors.text,
                      },
                    ]}
                    placeholder="Enter recipient's user ID"
                    placeholderTextColor={currentColors.textSecondary}
                    value={recipientId}
                    onChangeText={setRecipientId}
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.helperText,
                    { color: currentColors.textSecondary },
                  ]}
                >
                  The recipient must be a registered user to receive points
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: currentColors.text }]}>
                Personal Message (Optional)
              </Text>
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.textAreaWrapper, { borderColor: currentColors.border }]}
              >
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      color: currentColors.text,
                    },
                  ]}
                  placeholder="Add a personal message..."
                  placeholderTextColor={currentColors.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </View>

            {/* Summary */}
            <LinearGradient
              colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.summary, 
                { borderColor: currentColors.border }
              ]}
            >
              {giftType === "money" ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: currentColors.textSecondary },
                      ]}
                    >
                      Gift Card Amount
                    </Text>
                    <Text
                      style={[styles.summaryValue, { color: currentColors.text }]}
                    >
                      ${selectedAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.border }]}>
                    <Text
                      style={[styles.totalLabel, { color: currentColors.text }]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        styles.totalValue,
                        { color: currentColors.secondary },
                      ]}
                    >
                      ${selectedAmount.toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: currentColors.textSecondary },
                      ]}
                    >
                      Your Points
                    </Text>
                    <Text
                      style={[styles.summaryValue, { color: currentColors.text }]}
                    >
                      {userPoints} pts
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: currentColors.textSecondary },
                      ]}
                    >
                      Points to Send
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: currentColors.secondary },
                      ]}
                    >
                      {selectedPoints} pts
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: currentColors.border }]}>
                    <Text
                      style={[styles.totalLabel, { color: currentColors.text }]}
                    >
                      Remaining Points
                    </Text>
                    <Text
                      style={[
                        styles.totalValue,
                        { color: currentColors.secondary },
                      ]}
                    >
                      {userPoints - selectedPoints} pts
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>

            <LinearGradient
              colors={[currentColors.secondary, currentColors.highlight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseButton}
            >
              <Pressable
                style={styles.purchaseButtonInner}
                onPress={handlePurchase}
              >
                <IconSymbol
                  name={giftType === "money" ? "gift.fill" : "star.fill"}
                  size={20}
                  color={currentColors.background}
                />
                <Text
                  style={[styles.purchaseButtonText, { color: currentColors.background }]}
                >
                  {giftType === "money"
                    ? "Purchase Gift Card"
                    : "Send Points Gift Card"}
                </Text>
              </Pressable>
            </LinearGradient>
          </ScrollView>
        </View>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    gap: 4,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.4)',
    elevation: 6,
  },
  pointsText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    borderRadius: 0,
    boxShadow: "0px 6px 20px rgba(212, 175, 55, 0.3)",
    elevation: 6,
    borderWidth: 2,
  },
  typeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amountButton: {
    width: "30%",
    borderRadius: 0,
    boxShadow: "0px 6px 20px rgba(212, 175, 55, 0.3)",
    elevation: 6,
    borderWidth: 2,
  },
  amountButtonInner: {
    paddingVertical: 16,
    alignItems: "center",
  },
  amountText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  inputWrapper: {
    borderRadius: 0,
    boxShadow: "0px 6px 20px rgba(212, 175, 55, 0.25)",
    elevation: 6,
    borderWidth: 2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    fontStyle: "italic",
  },
  textAreaWrapper: {
    borderRadius: 0,
    boxShadow: "0px 6px 20px rgba(212, 175, 55, 0.25)",
    elevation: 6,
    borderWidth: 2,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
  },
  summary: {
    padding: 16,
    borderRadius: 0,
    marginTop: 8,
    marginBottom: 20,
    boxShadow: "0px 8px 24px rgba(212, 175, 55, 0.3)",
    elevation: 8,
    borderWidth: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  purchaseButton: {
    borderRadius: 0,
    boxShadow: "0px 8px 24px rgba(212, 175, 55, 0.5)",
    elevation: 10,
  },
  purchaseButtonInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
