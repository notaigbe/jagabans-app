
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';
import { eventService } from '@/services/supabaseService';

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userProfile, currentColors, showToast, loadUserProfile } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [accessedInviteEvents, setAccessedInviteEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Load public events (visible to everyone)
      const { data: publicEvents, error: publicError } = await eventService.getPublicEvents();
      
      if (publicError) {
        console.error('Error loading public events:', publicError);
        showToast('Failed to load events', 'error');
        return;
      }

      // Load private events if authenticated
      let privateEvents: any[] = [];
      if (isAuthenticated) {
        const { data, error } = await eventService.getPrivateEvents();
        if (!error && data) {
          privateEvents = data;
        }
      }

      // Combine and transform events
      const allEvents: Event[] = [...(publicEvents || []), ...privateEvents].map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        attendees: [], // Will be populated from RSVPs if needed
        image: event.image,
        isPrivate: event.is_private,
        isInviteOnly: event.is_invite_only,
        shareableLink: event.shareable_link,
      }));

      setVisibleEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  const handleInviteLink = useCallback(async (token: string) => {
    try {
      const { data: event, error } = await eventService.getInviteOnlyEvent(token);
      
      if (error || !event) {
        Alert.alert('Invalid Invite', 'This invite link is invalid or has expired.');
        return;
      }

      const transformedEvent: Event = {
        id: (event as any)?.id || '',
        title: (event as any)?.title || '',
        description: (event as any)?.description || '',
        date: (event as any)?.date || '',
        location: (event as any)?.location || '',
        capacity: (event as any)?.capacity || 0,
        attendees: [],
        image: (event as any)?.image || '',
        isPrivate: (event as any)?.is_private || false,
        isInviteOnly: (event as any)?.is_invite_only || false,
        shareableLink: (event as any)?.shareable_link || null,
      };

      // Add to accessed invite events if not already there
      setAccessedInviteEvents((prev) => {
        const exists = prev.some((e) => e.id === transformedEvent.id);
        return exists ? prev : [...prev, transformedEvent];
      });

      showToast(`You now have access to "${transformedEvent.title}"!`, 'success');
    } catch (error) {
      console.error('Error accessing invite event:', error);
      Alert.alert('Error', 'Failed to access this event. Please try again.');
    }
  }, [showToast]);

  // Load events on mount and when authentication changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle invite-only event access via URL params
  useEffect(() => {
    if (params.token && typeof params.token === 'string') {
      handleInviteLink(params.token);
    }
  }, [params.token, handleInviteLink]);

  const handleRSVP = async (event: Event) => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP to events.');
      router.push('/(auth)/sign-in' as any);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isAlreadyRSVPd = userProfile?.rsvpEvents?.some((rsvp: any) => 
      rsvp.event_id === event.id || rsvp.eventId === event.id
    );
    
    if (isAlreadyRSVPd) {
      Alert.alert('Already RSVP\'d', 'You have already secured your spot for this event!');
      return;
    }

    const spotsLeft = event.capacity - event.attendees.length;
    
    if (spotsLeft <= 0) {
      Alert.alert('Event Full', 'Sorry, this event is at full capacity.');
      return;
    }

    Alert.alert(
      'Confirm RSVP',
      `Would you like to secure your spot for ${event.title}?\n\nSpots remaining: ${spotsLeft}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setRsvpLoading(event.id);
            try {
              const { error } = await eventService.rsvpEvent(user.id, event.id);
              
              if (error) {
                showToast('Failed to RSVP. Please try again.', 'error');
                return;
              }

              showToast(`RSVP confirmed for "${event.title}"!`, 'success');
              
              // Reload user profile to update RSVP list
              await loadUserProfile();
              
              // Reload events to update attendee count
              await loadEvents();
            } catch (error) {
              console.error('Error during RSVP:', error);
              showToast('Failed to RSVP. Please try again.', 'error');
            } finally {
              setRsvpLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleShareEvent = async (event: Event) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!event.isInviteOnly) {
      Alert.alert('Cannot Share', 'Only invite-only events can be shared with specific people.');
      return;
    }

    if (!event.shareableLink) {
      Alert.alert('Error', 'This event does not have a shareable link.');
      return;
    }

    const shareLink = event.shareableLink;
    const message = `You're invited to ${event.title} at Jagabans LA!\n\n${event.description}\n\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\n\nAccess the event: ${shareLink}`;

    try {
      const result = await Share.share({
        message,
        title: `Invitation: ${event.title}`,
      });

      if (result.action === Share.sharedAction) {
        showToast('Event invitation shared successfully!', 'success');
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Error', 'Failed to share event. Please try again.');
    }
  };

  // Combine regular visible events with accessed invite-only events
  const allVisibleEvents = [
    ...visibleEvents.filter((e) => !e.isInviteOnly),
    ...accessedInviteEvents,
  ];

  const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentColors.card,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 2,
    },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    borderRadius: 0,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  eventCard: {
    borderRadius: 0,
    marginBottom: 20,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    gap: 12,
    marginBottom: 20,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  rsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    borderRadius: 12,
    padding: 16,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.back();
                      }}
                      style={styles.backButton}
                    >
                      <IconSymbol name="chevron.left" size={24} color={currentColors.primary} />
                    </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Events</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentColors.primary} />
            <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
              Loading events...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.infoCard, { backgroundColor: currentColors.highlight + '20' }]}>
              <IconSymbol name="star.fill" size={24} color={currentColors.highlight} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoText, { color: currentColors.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>Private Events:</Text> Open to all app members
                </Text>
                <Text style={[styles.infoText, { color: currentColors.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>Invite Only:</Text> Accessible via shared link only
                </Text>
              </View>
            </View>

            {allVisibleEvents.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: currentColors.card }]}>
                <IconSymbol name="calendar" size={48} color={currentColors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: currentColors.textSecondary }]}>
                  No events available at the moment
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: currentColors.textSecondary }]}>
                  Check back later or ask for an invite link to exclusive events!
                </Text>
              </View>
            )}

            {allVisibleEvents.map((event) => {
              const spotsLeft = event.capacity - event.attendees.length;
              const isRSVPd = userProfile?.rsvpEvents?.some((rsvp: any) => 
                rsvp.event_id === event.id || rsvp.eventId === event.id
              );
              const isRSVPing = rsvpLoading === event.id;

              return (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: currentColors.card }]}>
                  <Image
                    source={{ uri: event.image }}
                    style={[styles.eventImage, { backgroundColor: currentColors.textSecondary + '20' }]}
                  />
                  <View style={styles.badgeContainer}>
                    {event.isPrivate && !event.isInviteOnly && (
                      <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
                        <IconSymbol name="lock.fill" size={12} color={currentColors.card} />
                        <Text style={[styles.badgeText, { color: currentColors.card }]}>Private Event</Text>
                      </View>
                    )}
                    {event.isInviteOnly && (
                      <View style={[styles.badge, { backgroundColor: currentColors.secondary }]}>
                        <IconSymbol name="envelope.fill" size={12} color={currentColors.card} />
                        <Text style={[styles.badgeText, { color: currentColors.card }]}>Invite Only</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventTitle, { color: currentColors.text }]}>{event.title}</Text>
                    <Text style={[styles.eventDescription, { color: currentColors.textSecondary }]}>
                      {event.description}
                    </Text>

                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <IconSymbol name="calendar" size={16} color={currentColors.primary} />
                        <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <IconSymbol name="location.fill" size={16} color={currentColors.primary} />
                        <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                          {event.location}
                        </Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <IconSymbol name="person.2.fill" size={16} color={currentColors.primary} />
                        <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                          {spotsLeft} spots left
                        </Text>
                      </View>
                    </View>

                    <View style={styles.buttonRow}>
                      <Pressable
                        style={[
                          styles.rsvpButton,
                          { backgroundColor: currentColors.primary },
                          isRSVPd && { backgroundColor: currentColors.accent },
                          spotsLeft <= 0 && { backgroundColor: currentColors.textSecondary + '40' },
                        ]}
                        onPress={() => handleRSVP(event)}
                        disabled={spotsLeft <= 0 || isRSVPing}
                      >
                        {isRSVPing ? (
                          <ActivityIndicator size="small" color={currentColors.card} />
                        ) : (
                          <Text style={[styles.rsvpButtonText, { color: currentColors.card }]}>
                            {isRSVPd ? 'RSVP Confirmed' : spotsLeft <= 0 ? 'Event Full' : 'RSVP Now'}
                          </Text>
                        )}
                      </Pressable>
                      {event.isInviteOnly && (
                        <Pressable
                          style={[styles.shareButton, { backgroundColor: currentColors.secondary }]}
                          onPress={() => handleShareEvent(event)}
                        >
                          <IconSymbol name="square.and.arrow.up" size={20} color={currentColors.card} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
