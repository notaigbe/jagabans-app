
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { Event } from "@/types";
import { eventService } from "@/services/supabaseService";
import * as Haptics from "expo-haptics";
import DateTimePicker from '@react-native-community/datetimepicker';
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";
import ImagePicker from "@/components/ImagePicker";

export default function AdminEventManagement() {
  const router = useRouter();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    location: "",
    capacity: "",
    image: "",
    isPrivate: true,
    isInviteOnly: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const privateRes = await eventService.getPrivateEvents();
      const publicRes = await eventService.getPublicEvents();

      if (privateRes.error && publicRes.error) {
        throw new Error("Failed to load events");
      }

      const allEvents = [
        ...(privateRes.data || []),
        ...(publicRes.data || []),
      ].map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        attendees: [],
        image: event.image,
        isPrivate: event.is_private,
        isInviteOnly: event.is_invite_only,
        shareableLink: event.shareable_link,
      }));

      setEvents(allEvents);
    } catch (err) {
      console.error("Failed to load events", err);
      showToast('error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(formData.date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setFormData({ ...formData, date: newDate });
    }
  };

  const handleAddEvent = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!formData.title.trim()) {
      showToast('error', 'Event title is required');
      return;
    }
    if (!formData.location.trim()) {
      showToast('error', 'Event location is required');
      return;
    }
    if (!formData.image.trim()) {
      showToast('error', 'Event image is required');
      return;
    }

    try {
      setSaving(true);

      const newEventData: Omit<Event, "id" | "attendees"> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date.toISOString(),
        location: formData.location.trim(),
        capacity: parseInt(formData.capacity) || 50,
        image: formData.image.trim(),
        isPrivate: formData.isPrivate,
        isInviteOnly: formData.isInviteOnly,
      };

      const res = await eventService.createEvent(newEventData);
      if (res.error) throw res.error;

      await loadEvents();
      setIsAddingEvent(false);
      resetForm();

      if (formData.isInviteOnly) {
        showDialog(
          "Event Created!",
          "Invite Only event created successfully. Use the share button to send invitations.",
          [{ text: "OK", onPress: () => {}, style: 'default' }]
        );
      } else {
        showToast('success', 'Private Event created successfully');
      }
    } catch (err) {
      console.error("Failed to create event", err);
      showToast('error', 'Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog(
      "Confirm Delete",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await eventService.deleteEvent(eventId);
              if (res.error) throw res.error;

              await loadEvents();
              showToast('success', 'Event deleted successfully');
            } catch (err) {
              console.error("Failed to delete event", err);
              showToast('error', 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShareEvent = async (event: Event) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!event.shareableLink) {
      showToast('error', 'This event does not have a shareable link.');
      return;
    }

    const message = `You're invited to ${event.title} at Jagabans LA!

${event.description}

Date: ${new Date(event.date).toLocaleDateString()} at ${new Date(
      event.date
    ).toLocaleTimeString()}
Location: ${event.location}

Access the event: ${event.shareableLink}`;

    try {
      const result = await Share.share({
        message,
        title: `Invitation: ${event.title}`,
      });

      if (result.action === Share.sharedAction) {
        showToast('success', 'Event invitation shared successfully!');
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      showToast('error', 'Failed to share event. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      location: "",
      capacity: "",
      image: "",
      isPrivate: true,
      isInviteOnly: false,
    });
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

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
        <Text style={styles.title}>Event Management</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setIsAddingEvent(!isAddingEvent);
            if (isAddingEvent) resetForm();
          }}
        >
          <IconSymbol
            name={isAddingEvent ? "close" : "add"}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isAddingEvent && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create New Event</Text>

            <TextInput
              style={styles.input}
              placeholder="Event Title *"
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              editable={!saving}
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
              textAlignVertical="top"
              editable={!saving}
            />

            <View style={styles.dateTimeContainer}>
              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                disabled={saving}
              >
                <IconSymbol name="calendar-today" size={20} color={colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {formData.date.toLocaleDateString()}
                </Text>
              </Pressable>

              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                disabled={saving}
              >
                <IconSymbol name="schedule" size={20} color={colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {formData.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={formData.date}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Location *"
              placeholderTextColor={colors.textSecondary}
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              editable={!saving}
            />

            <TextInput
              style={styles.input}
              placeholder="Capacity (default: 50)"
              placeholderTextColor={colors.textSecondary}
              value={formData.capacity}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  capacity: text.replace(/[^0-9]/g, ""),
                })
              }
              keyboardType="number-pad"
              editable={!saving}
            />

            <ImagePicker
              currentImageUrl={formData.image}
              onImageSelected={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              bucket="merchandise"
              folder="events"
              label="Event Image *"
              disabled={saving}
            />

            <View style={styles.eventTypeSection}>
              <Text style={styles.eventTypeTitle}>Event Type</Text>

              <Pressable
                style={styles.checkboxContainer}
                onPress={() => {
                  if (saving) return;
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setFormData({
                    ...formData,
                    isPrivate: true,
                    isInviteOnly: false,
                  });
                }}
                disabled={saving}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.isPrivate &&
                      !formData.isInviteOnly &&
                      styles.checkboxChecked,
                  ]}
                >
                  {formData.isPrivate && !formData.isInviteOnly && (
                    <IconSymbol name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>Private Event</Text>
                  <Text style={styles.checkboxSubtext}>
                    Open to all app members
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.checkboxContainer}
                onPress={() => {
                  if (saving) return;
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setFormData({
                    ...formData,
                    isInviteOnly: true,
                    isPrivate: false,
                  });
                }}
                disabled={saving}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.isInviteOnly && styles.checkboxChecked,
                  ]}
                >
                  {formData.isInviteOnly && (
                    <IconSymbol name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>Invite Only Event</Text>
                  <Text style={styles.checkboxSubtext}>
                    Accessible via shared link only
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.formButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setIsAddingEvent(false);
                  resetForm();
                }}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.saveButton,
                  saving && styles.buttonDisabled,
                ]}
                onPress={handleAddEvent}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Event</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.eventsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="event" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No events yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first event to get started
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Image
                  source={{ uri: event.image }}
                  style={styles.eventImage}
                />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <View style={styles.badgeContainer}>
                      {event.isPrivate && !event.isInviteOnly && (
                        <View style={styles.privateBadge}>
                          <IconSymbol name="lock" size={12} color="#FFFFFF" />
                          <Text style={styles.privateBadgeText}>Private</Text>
                        </View>
                      )}
                      {event.isInviteOnly && (
                        <View style={[styles.privateBadge, styles.inviteBadge]}>
                          <IconSymbol name="mail" size={12} color="#FFFFFF" />
                          <Text style={styles.privateBadgeText}>
                            Invite Only
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {event.description ? (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  ) : null}

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetail}>
                      <IconSymbol
                        name="calendar-today"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>
                        {formatDateForDisplay(event.date)}
                      </Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <IconSymbol
                        name="location-on"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <IconSymbol
                        name="people"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.eventDetailText}>
                        {event.attendees?.length || 0} / {event.capacity}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    {event.isInviteOnly && (
                      <Pressable
                        style={styles.shareEventButton}
                        onPress={() => handleShareEvent(event)}
                      >
                        <IconSymbol
                          name="share"
                          size={18}
                          color={colors.primary}
                        />
                        <Text style={styles.shareEventButtonText}>
                          Share Invite
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[
                        styles.deleteButton,
                        event.isInviteOnly && styles.deleteButtonCompact,
                      ]}
                      onPress={() => handleDeleteEvent(event.id)}
                    >
                      <IconSymbol name="delete" size={18} color="#FF6B6B" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
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
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  eventTypeSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  eventTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  checkboxSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
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
  eventsContainer: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.border,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  badgeContainer: {
    gap: 4,
    alignItems: "flex-end",
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  inviteBadge: {
    backgroundColor: colors.secondary,
  },
  privateBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  shareEventButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary + "20",
  },
  shareEventButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FF6B6B20",
  },
  deleteButtonCompact: {
    flex: 0,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
  },
});
