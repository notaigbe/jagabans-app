
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { reservationService } from '@/services/supabaseService';
import { Reservation } from '@/types';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';
import { formatLocalDate } from '@/utils/dateUtils';

export default function AdminReservations() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | Reservation['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTableNumber, setEditingTableNumber] = useState('');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showDialog = (title: string, message: string, buttons: { text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[]) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const fetchReservations = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await reservationService.getAllReservations();
      
      if (error) {
        console.error('Error fetching reservations:', error);
        showToast('error', 'Failed to load reservations');
        return;
      }

      if (data) {
        const formattedReservations: Reservation[] = data.map((res: any) => ({
          id: res.id,
          name: res.name,
          email: res.email,
          phone: res.phone,
          date: res.date,
          time: res.time,
          guests: res.guests,
          specialRequests: res.special_requests,
          status: res.status || 'pending',
          tableNumber: res.table_number,
          createdAt: res.created_at,
        }));
        
        // Sort by createdAt in descending order (most recent first)
        formattedReservations.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      showToast('error', 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusUpdate = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const { error } = await reservationService.updateReservationStatus(reservationId, newStatus);
      
      if (error) {
        showToast('error', 'Failed to update reservation status');
        return;
      }

      setReservations(prev =>
        prev.map(res =>
          res.id === reservationId ? { ...res, status: newStatus } : res
        )
      );

      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => prev ? { ...prev, status: newStatus } : null);
      }

      showToast('success', 'Reservation status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('error', 'Failed to update reservation status');
    }
  };

  const handleTableNumberUpdate = async () => {
    if (!selectedReservation) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const { error } = await reservationService.updateReservationTable(
        selectedReservation.id,
        editingTableNumber
      );
      
      if (error) {
        showToast('error', 'Failed to update table number');
        return;
      }

      setReservations(prev =>
        prev.map(res =>
          res.id === selectedReservation.id
            ? { ...res, tableNumber: editingTableNumber }
            : res
        )
      );

      setSelectedReservation(prev =>
        prev ? { ...prev, tableNumber: editingTableNumber } : null
      );

      showToast('success', 'Table number updated');
    } catch (error) {
      console.error('Error updating table number:', error);
      showToast('error', 'Failed to update table number');
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    showDialog(
      'Delete Reservation',
      'Are you sure you want to delete this reservation?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await reservationService.deleteReservation(reservationId);
              
              if (error) {
                showToast('error', 'Failed to delete reservation');
                return;
              }

              setReservations(prev => prev.filter(res => res.id !== reservationId));
              setShowDetailModal(false);
              showToast('success', 'Reservation deleted');
            } catch (error) {
              console.error('Error deleting reservation:', error);
              showToast('error', 'Failed to delete reservation');
            }
          },
        },
      ]
    );
  };

  const openDetailModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditingTableNumber(reservation.tableNumber || '');
    setShowDetailModal(true);
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return '#4ECDC4';
      case 'completed':
        return '#95E1D3';
      case 'cancelled':
        return '#FF6B6B';
      case 'no-show':
        return '#FFA07A';
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'check-circle';
      case 'completed':
        return 'done-all';
      case 'cancelled':
        return 'cancel';
      case 'no-show':
        return 'person-off';
      default:
        return 'schedule';
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesStatus = filterStatus === 'all' || res.status === filterStatus;
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Reservations</Text>
          <Text style={styles.subtitle}>Manage table bookings</Text>
        </View>
        <Pressable
          style={styles.refreshButton}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            fetchReservations();
          }}
        >
          <IconSymbol name="arrow.clockwise" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
          <Pressable
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setFilterStatus(status);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="calendar.badge.exclamationmark" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No reservations found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Reservations from the website will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.reservationsContainer}>
            {filteredReservations.map(reservation => (
              <Pressable
                key={reservation.id}
                style={({ pressed }) => [
                  styles.reservationCard,
                  pressed && styles.reservationCardPressed,
                ]}
                onPress={() => openDetailModal(reservation)}
              >
                <View style={styles.reservationHeader}>
                  <View style={styles.reservationInfo}>
                    <Text style={styles.reservationName}>{reservation.name}</Text>
                    <Text style={styles.reservationEmail}>{reservation.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reservation.status) + '20' },
                    ]}
                  >
                    <IconSymbol
                      name={getStatusIcon(reservation.status)}
                      size={16}
                      color={getStatusColor(reservation.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(reservation.status) },
                      ]}
                    >
                      {reservation.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.reservationDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="calendar.badge.plus" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {formatLocalDate(reservation.date, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock.badge.checkmark" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{reservation.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{reservation.guests} guests</Text>
                  </View>
                  {reservation.tableNumber && (
                    <View style={styles.detailRow}>
                      <IconSymbol name="table.furniture" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>Table {reservation.tableNumber}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reservation Details</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowDetailModal(false)}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </Pressable>
            </View>

            {selectedReservation && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Customer Information</Text>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="person" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>{selectedReservation.name}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>{selectedReservation.email}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="phone.fill" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>{selectedReservation.phone}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Reservation Details</Text>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="calendar.badge.plus" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>
                      {formatLocalDate(selectedReservation.date, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: 'America/Los_Angeles',
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="clock.badge.checkmark" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>{selectedReservation.time}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <IconSymbol name="person.2" size={20} color={colors.textSecondary} />
                    <Text style={styles.modalDetailText}>
                      {selectedReservation.guests} guests
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Table Assignment</Text>
                  <View style={styles.tableInputContainer}>
                    <TextInput
                      style={styles.tableInput}
                      placeholder="Enter table number"
                      placeholderTextColor={colors.textSecondary}
                      value={editingTableNumber}
                      onChangeText={setEditingTableNumber}
                    />
                    <Pressable
                      style={styles.tableUpdateButton}
                      onPress={handleTableNumberUpdate}
                    >
                      <Text style={styles.tableUpdateButtonText}>Update</Text>
                    </Pressable>
                  </View>
                </View>

                {selectedReservation.specialRequests && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Special Requests</Text>
                    <Text style={styles.specialRequestsText}>
                      {selectedReservation.specialRequests}
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Update Status</Text>
                  <View style={styles.statusButtonsContainer}>
                    {(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'] as const).map(
                      status => (
                        <Pressable
                          key={status}
                          style={[
                            styles.statusButton,
                            selectedReservation.status === status &&
                              styles.statusButtonActive,
                            { borderColor: getStatusColor(status) },
                          ]}
                          onPress={() =>
                            handleStatusUpdate(selectedReservation.id, status)
                          }
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              selectedReservation.status === status && {
                                color: getStatusColor(status),
                              },
                            ]}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </View>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReservation(selectedReservation.id)}
                >
                  <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete Reservation</Text>
                </Pressable>
              </ScrollView>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  reservationsContainer: {
    padding: 16,
    gap: 12,
  },
  reservationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reservationCardPressed: {
    opacity: 0.7,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  reservationEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reservationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  tableInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tableInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableUpdateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  tableUpdateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  specialRequestsText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  statusButtonActive: {
    backgroundColor: colors.card,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
