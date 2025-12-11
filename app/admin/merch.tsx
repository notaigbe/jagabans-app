
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { MerchItem } from '@/types';
import { merchService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';
import ImagePicker from '@/components/ImagePicker';

interface MerchFormData {
  name: string;
  description: string;
  pointsCost: string;
  image: string;
  inStock: boolean;
}

export default function AdminMerchManagement() {
  const router = useRouter();
  const { showToast: appShowToast } = useApp();
  const [items, setItems] = React.useState<MerchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<MerchItem | null>(null);
  const [formData, setFormData] = React.useState<MerchFormData>({
    name: '',
    description: '',
    pointsCost: '',
    image: '',
    inStock: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  // Toast state
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('success');

  const showDialog = useCallback((title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const fetchMerchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await merchService.getMerchItems();
      if (res.error) throw res.error;
      
      // Map database fields to app fields
      const mappedItems = (res.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        pointsCost: item.points_cost,
        image: item.image,
        inStock: item.in_stock,
      }));
      
      setItems(mappedItems);
    } catch (err) {
      console.error('Failed to load merch items', err);
      showToast('Failed to load merchandise items', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    fetchMerchItems();
  }, [fetchMerchItems]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pointsCost: '',
      image: '',
      inStock: true,
    });
    setSelectedItem(null);
  };

  const openAddModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: MerchItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      pointsCost: item.pointsCost.toString(),
      image: item.image,
      inStock: item.inStock,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast('Please enter a name', 'error');
      return false;
    }
    if (!formData.description.trim()) {
      showToast('Please enter a description', 'error');
      return false;
    }
    if (!formData.pointsCost.trim() || isNaN(Number(formData.pointsCost)) || Number(formData.pointsCost) <= 0) {
      showToast('Please enter a valid points cost', 'error');
      return false;
    }
    if (!formData.image.trim()) {
      showToast('Please select an image', 'error');
      return false;
    }
    return true;
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const newItem: Omit<MerchItem, 'id'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pointsCost: Number(formData.pointsCost),
        image: formData.image.trim(),
        inStock: formData.inStock,
      };

      const { data, error } = await merchService.addMerchItem(newItem);
      
      if (error) {
        console.error('Error adding merch item:', error);
        showToast('Failed to add merchandise item', 'error');
        return;
      }

      showToast('Merchandise item added successfully!', 'success');
      closeModals();
      await fetchMerchItems();
    } catch (err) {
      console.error('Exception adding merch item:', err);
      showToast('Failed to add merchandise item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !validateForm()) return;

    try {
      setSubmitting(true);
      const updates: Partial<MerchItem> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pointsCost: Number(formData.pointsCost),
        image: formData.image.trim(),
        inStock: formData.inStock,
      };

      const { error } = await merchService.updateMerchItem(selectedItem.id, updates);
      
      if (error) {
        console.error('Error updating merch item:', error);
        showToast('Failed to update merchandise item', 'error');
        return;
      }

      showToast('Merchandise item updated successfully!', 'success');
      closeModals();
      await fetchMerchItems();
    } catch (err) {
      console.error('Exception updating merch item:', err);
      showToast('Failed to update merchandise item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Show confirmation dialog
    showDialog(
      'Confirm Delete',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await merchService.deleteMerchItem(itemId);
              
              if (error) {
                console.error('Error deleting merch item:', error);
                showToast('Failed to delete merchandise item', 'error');
                return;
              }

              showToast('Merchandise item deleted successfully!', 'success');
              await fetchMerchItems();
            } catch (err) {
              console.error('Exception deleting merch item:', err);
              showToast('Failed to delete merchandise item', 'error');
            }
          }
        }
      ]
    );
  };

  const renderForm = (isEdit: boolean) => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContainer}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formScrollContent}
      >
        <Text style={styles.formLabel}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter merchandise name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.formLabel}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Enter description"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.formLabel}>Points Cost *</Text>
        <TextInput
          style={styles.input}
          value={formData.pointsCost}
          onChangeText={(text) => setFormData({ ...formData, pointsCost: text })}
          placeholder="Enter points cost"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        <ImagePicker
          currentImageUrl={formData.image}
          onImageSelected={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
          bucket="merchandise"
          folder="items"
          label="Merchandise Image *"
          disabled={submitting}
        />

        <View style={styles.stockToggleContainer}>
          <Text style={styles.formLabel}>In Stock</Text>
          <Pressable
            style={[
              styles.stockToggle,
              formData.inStock ? styles.stockToggleActive : styles.stockToggleInactive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setFormData({ ...formData, inStock: !formData.inStock });
            }}
          >
            <Text style={styles.stockToggleText}>
              {formData.inStock ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formButtons}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              closeModals();
            }}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={isEdit ? handleUpdateItem : handleAddItem}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update' : 'Add'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

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
              router.replace('/admin' as any);
            }
          }}
        >
          <IconSymbol name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Merchandise</Text>
        <Pressable style={styles.addButton} onPress={openAddModal}>
          <IconSymbol name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.merchContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading merchandise...</Text>
            </View>
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <View key={index} style={styles.merchCard}>
                <Image source={{ uri: item.image }} style={styles.merchImage} />
                <View style={styles.merchContent}>
                  <Text style={styles.merchName}>{item.name}</Text>
                  <Text style={styles.merchDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.merchFooter}>
                    <View style={styles.pointsCost}>
                      <IconSymbol name="stars" size={16} color={colors.primary} />
                      <Text style={styles.pointsText}>{item.pointsCost} points</Text>
                    </View>
                    <View
                      style={[
                        styles.stockBadge,
                        { backgroundColor: item.inStock ? '#4CAF5020' : '#FF6B6B20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockText,
                          { color: item.inStock ? '#4CAF50' : '#FF6B6B' },
                        ]}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(item)}
                    >
                      <IconSymbol name="edit" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteItem(item.id, item.name)}
                    >
                      <IconSymbol name="delete" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="shopping-bag" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No merchandise available</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add items</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Merchandise Item</Text>
              <Pressable onPress={closeModals} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            {renderForm(false)}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Merchandise Item</Text>
              <Pressable onPress={closeModals} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            {renderForm(true)}
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  merchContainer: {
    padding: 16,
    gap: 16,
  },
  merchCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  merchContent: {
    flex: 1,
    marginLeft: 12,
  },
  merchName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  merchDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  merchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
  },
  formScrollContent: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  stockToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stockToggle: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stockToggleActive: {
    backgroundColor: '#4CAF50',
  },
  stockToggleInactive: {
    backgroundColor: '#FF6B6B',
  },
  stockToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
