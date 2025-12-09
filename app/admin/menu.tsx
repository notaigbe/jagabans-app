
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { menuItems as staticMenuItems } from "@/data/menuData";
import { menuService, imageService } from "@/services/supabaseService";
import { MenuItem } from "@/types";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";

export default function AdminMenuManagement() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>(staticMenuItems);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Dishes",
    image: "",
  });

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

  const categories: string[] = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showDialog('Permission Required', 'Please allow access to your photo library', [
          { text: 'OK', onPress: () => {}, style: 'default' }
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast('error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique filename
      const filename = `menu-${Date.now()}.jpg`;
      const path = `menu/${filename}`;

      // Upload to Supabase Storage
      const uploadResult = await imageService.uploadImage(
        "menu",
        path,
        blob,
        { contentType: "image/jpeg", upsert: true }
      );

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      // Get the public URL
      const publicUrl = imageService.getPublicUrl("menu", path);

      if (publicUrl) {
        setFormData({ ...formData, image: publicUrl });
        showToast('success', 'Image uploaded successfully');
      } else {
        throw new Error("Failed to get public URL");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast('error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = () => {
    console.log("Adding new menu item");
    (async () => {
      if (!formData.name || !formData.price) {
        showToast('error', 'Please fill in all required fields');
        return;
      }

      const payload: Omit<MenuItem, "id"> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image:
          formData.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        popular: false,
        available: true,
      };

      try {
        const res = await menuService.addMenuItem(payload);
        if (res.error || !res.data) throw res.error || new Error("Add failed");
        const added = res.data as MenuItem | null;
        if (added) setItems((s) => [added, ...s]);
        setIsAddingItem(false);
        resetForm();
        showToast('success', 'Menu item added successfully');
      } catch (err) {
        console.error("Add menu item failed", err);
        showToast('error', 'Unable to add menu item');
      }
    })();
  };

  const handleUpdateItem = (itemId: string) => {
    console.log("Updating menu item");
    (async () => {
      const updates: Partial<MenuItem> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
      };

      try {
        const res = await menuService.updateMenuItem(itemId, updates);
        if (res.error || !res.data)
          throw res.error || new Error("Update failed");
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId ? (res.data as MenuItem) : it
          )
        );
        setEditingItemId(null);
        resetForm();
        showToast('success', 'Menu item updated successfully');
      } catch (err) {
        console.error("Update menu item failed", err);
        showToast('error', 'Unable to update menu item');
      }
    })();
  };

  const handleDeleteItem = (itemId: string) => {
    console.log("Deleting menu item:", itemId);
    showDialog(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await menuService.deleteMenuItem(itemId);
              if (res.error) throw res.error;
              setItems((prev) => prev.filter((item) => item.id !== itemId));
              showToast('success', 'Menu item deleted');
            } catch (err) {
              console.error("Delete failed", err);
              showToast('error', 'Unable to delete menu item');
            }
          },
        },
      ]
    );
  };

  const handleEditItem = (item: MenuItem) => {
    console.log("Editing menu item:", item.id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Main Dishes",
      image: "",
    });
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await menuService.getMenuItems();
        if (res.error) throw res.error;
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed to load menu items", err);
      }
    })();
  }, []);

  const renderEditForm = (itemId?: string) => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {itemId ? "Edit Menu Item" : "Add New Menu Item"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name *"
        placeholderTextColor={colors.textSecondary}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        placeholderTextColor={colors.textSecondary}
        value={formData.description}
        onChangeText={(text) =>
          setFormData({ ...formData, description: text })
        }
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={styles.input}
        placeholder="Price *"
        placeholderTextColor={colors.textSecondary}
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        keyboardType="decimal-pad"
      />

      <View style={styles.categorySelector}>
        <Text style={styles.inputLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories
            .filter((cat) => cat !== "All")
            .map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  formData.category === category &&
                    styles.categoryChipActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light
                    );
                  }
                  setFormData({ ...formData, category });
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    formData.category === category &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>

      <View style={styles.imageSection}>
        <Text style={styles.inputLabel}>Image:</Text>
        {formData.image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: formData.image }} style={styles.imagePreview} />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setFormData({ ...formData, image: "" })}
            >
              <IconSymbol name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
        
        <Pressable
          style={styles.uploadButton}
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <React.Fragment>
              <IconSymbol name="image" size={20} color={colors.primary} />
              <Text style={styles.uploadButtonText}>
                {formData.image ? "Change Image" : "Upload Image"}
              </Text>
            </React.Fragment>
          )}
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Or paste Image URL"
        placeholderTextColor={colors.textSecondary}
        value={formData.image}
        onChangeText={(text) => setFormData({ ...formData, image: text })}
      />

      <View style={styles.formButtons}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (itemId) {
              setEditingItemId(null);
            } else {
              setIsAddingItem(false);
            }
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={() => itemId ? handleUpdateItem(itemId) : handleAddItem()}
        >
          <Text style={styles.saveButtonText}>
            {itemId ? "Update" : "Add Item"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Menu Management</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setIsAddingItem(!isAddingItem);
            setEditingItemId(null);
            resetForm();
          }}
        >
          <IconSymbol
            name={isAddingItem ? "close" : "add"}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isAddingItem && renderEditForm()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedCategory(category);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <React.Fragment key={item.id}>
              <View style={styles.menuItem}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEditItem(item)}
                  >
                    <IconSymbol name="edit" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <IconSymbol name="delete" size={20} color="#FF6B6B" />
                  </Pressable>
                </View>
              </View>
              
              {editingItemId === item.id && renderEditForm(item.id)}
            </React.Fragment>
          ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: 8,
  },
  formContainer: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  categorySelector: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  imageSection: {
    marginBottom: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  categoryFilterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  itemsContainer: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemActions: {
    justifyContent: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
