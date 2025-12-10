import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import Dialog from '@/components/Dialog';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';
import { eventService } from '@/services/supabaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userProfile, currentColors, showToast, loadUserProfile } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [accessedInviteEvents, setAccessedInviteEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [userRSVPs, setUserRSVPs] = useState<Set<string>>(new Set());
  const [bannedEventIds, setBannedEventIds] = useState<Set<string>>(new Set());
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'destructive' | 'cancel';
    }>;
  }>({
    title: '',
    message: '',
    buttons: [],
  });

  const showDialog = (config: typeof dialogConfig) => {
    setDialogConfig(config);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const loadUserRSVPs = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUserRSVPs(new Set());
      setBannedEventIds(new Set());
      return;
    }

    try {
      const { data, error } = await eventService.getUserRSVPs(user.id);
      
      if (error) {
        console.error('Error loading user RSVPs:', error);
        return;
      }

      if (data) {
        const rsvpEventIds = new Set(data.map((rsvp: any) => rsvp.event_id));
        setUserRSVPs(rsvpEventIds);
        console.log('Loaded user RSVPs:', rsvpEventIds);
      }

      // Load banned events
      const { data: bans, error: bansError } = await eventService.getUserEventBans(user.id);
      if (!bansError && bans) {
        const bannedIds = new Set(bans.map((ban: any) => ban.event_id));
        setBannedEventIds(bannedIds);
        console.log('Loaded banned events:', bannedIds);
      }
    } catch (error) {
      console.error('Error loading user RSVPs:', error);
    }
  }, [isAuthenticated, user]);

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
        availableSpots: event.available_spots ?? event.capacity,
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
        showDialog({
          title: 'Invalid Invite',
          message: 'This invite link is invalid or has expired.',
          buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
        });
        return;
      }

      const transformedEvent: Event = {
        id: (event as any)?.id || '',
        title: (event as any)?.title || '',
        description: (event as any)?.description || '',
        date: (event as any)?.date || '',
        location: (event as any)?.location || '',
        capacity: (event as any)?.capacity || 0,
        availableSpots: (event as any)?.available_spots ?? (event as any)?.capacity ?? 0,
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
      showDialog({
        title: 'Error',
        message: 'Failed to access this event. Please try again.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
    }
  }, [showToast]);

  // Load events and RSVPs on mount and when authentication changes
  useEffect(() => {
    loadEvents();
    loadUserRSVPs();
  }, [loadEvents, loadUserRSVPs]);

  // Handle invite-only event access via URL params
  useEffect(() => {
    if (params.token && typeof params.token === 'string') {
      handleInviteLink(params.token);
    }
  }, [params.token, handleInviteLink]);

  const handleRSVP = async (event: Event) => {
    if (!isAuthenticated || !user) {
      showDialog({
        title: 'Sign In Required',
        message: 'Please sign in to RSVP to events.',
        buttons: [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => {
              router.push('/(auth)/sign-in' as any);
            },
          },
        ],
      });
      return;
    }

    // Check if user is banned from this event
    if (bannedEventIds.has(event.id)) {
      showDialog({
        title: 'Access Denied',
        message: 'You have been banned from this event by an administrator.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isAlreadyRSVPd = userRSVPs.has(event.id);
    
    if (isAlreadyRSVPd) {
      showDialog({
        title: 'Already RSVP\'d',
        message: 'You have already secured your spot for this event!',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
      return;
    }

    if (event.availableSpots <= 0) {
      showDialog({
        title: 'Event Full',
        message: 'Sorry, this event is at full capacity.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
      return;
    }

    showDialog({
      title: 'Confirm RSVP',
      message: `Would you like to secure your spot for ${event.title}?\n\nSpots remaining: ${event.availableSpots}`,
      buttons: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setDialogVisible(false);
            setRsvpLoading(event.id);
            try {
              const { error } = await eventService.rsvpEvent(user.id, event.id);
              
              if (error) {
                console.error('RSVP error:', error);
                showToast('Failed to RSVP. Please try again.', 'error');
                return;
              }

              // Update local state optimistically
              setVisibleEvents((prevEvents) =>
                prevEvents.map((e) =>
                  e.id === event.id
                    ? { ...e, availableSpots: Math.max(0, e.availableSpots - 1) }
                    : e
                )
              );

              // Add to user RSVPs
              setUserRSVPs((prev) => new Set([...prev, event.id]));

              showToast(`RSVP confirmed for "${event.title}"!`, 'success');
              
              // Reload user profile to update RSVP list
              await loadUserProfile();
              
              // Reload events to get updated data from server
              await loadEvents();
              await loadUserRSVPs();
            } catch (error) {
              console.error('Error during RSVP:', error);
              showToast('Failed to RSVP. Please try again.', 'error');
            } finally {
              setRsvpLoading(null);
            }
          },
        },
      ],
    });
  };

  const handleCancelRSVP = async (event: Event) => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDialog({
      title: 'Cancel Reservation',
      message: `Are you sure you want to cancel your reservation for ${event.title}?`,
      buttons: [
        { text: 'Keep Reservation', onPress: () => {}, style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            setDialogVisible(false);
            setRsvpLoading(event.id);
            try {
              const { error } = await eventService.cancelRSVP(user.id, event.id);
              
              if (error) {
                console.error('Cancel RSVP error:', error);
                showToast('Failed to cancel reservation. Please try again.', 'error');
                return;
              }

              // Update local state optimistically
              setVisibleEvents((prevEvents) =>
                prevEvents.map((e) =>
                  e.id === event.id
                    ? { ...e, availableSpots: Math.min(e.capacity, e.availableSpots + 1) }
                    : e
                )
              );

              // Remove from user RSVPs
              setUserRSVPs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(event.id);
                return newSet;
              });

              showToast(`Reservation cancelled for "${event.title}"`, 'success');
              
              // Reload user profile to update RSVP list
              await loadUserProfile();
              
              // Reload events to get updated data from server
              await loadEvents();
              await loadUserRSVPs();
            } catch (error) {
              console.error('Error during cancel RSVP:', error);
              showToast('Failed to cancel reservation. Please try again.', 'error');
            } finally {
              setRsvpLoading(null);
            }
          },
        },
      ],
    });
  };

  const handleShareEvent = async (event: Event) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!event.isInviteOnly) {
      showDialog({
        title: 'Cannot Share',
        message: 'Only invite-only events can be shared with specific people.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
      return;
    }

    if (!event.shareableLink) {
      showDialog({
        title: 'Error',
        message: 'This event does not have a shareable link.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
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
      showDialog({
        title: 'Error',
        message: 'Failed to share event. Please try again.',
        buttons: [{ text: 'OK', onPress: () => {}, style: 'cancel' }],
      });
    }
  };

  // Combine regular visible events with accessed invite-only events
  const allVisibleEvents = [
    ...visibleEvents.filter((e) => !e.isInviteOnly),
    ...accessedInviteEvents,
  ];

  return (
    <LinearGradient
      colors={[currentColors.gradientStart || currentColors.background, currentColors.gradientMid || currentColors.background, currentColors.gradientEnd || currentColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={[currentColors.headerGradientStart || currentColors.card, currentColors.headerGradientEnd || currentColors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomColor: currentColors.border }]}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
              style={[styles.backButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
            >
              <IconSymbol name="chevron.left" size={24} color={currentColors.secondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>Events</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentColors.secondary} />
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
              <LinearGradient
                colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.infoCard, { borderColor: currentColors.border }]}
              >
                <IconSymbol name="star.fill" size={24} color={currentColors.highlight} />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoText, { color: currentColors.text }]}>
                    <Text style={{ fontFamily: 'Inter_700Bold' }}>General Event:</Text> Open to public
                  </Text>
                  <Text style={[styles.infoText, { color: currentColors.text }]}>
                    <Text style={{ fontFamily: 'Inter_700Bold' }}>Private Events:</Text> Open to app members only
                  </Text>
                </View>
              </LinearGradient>

              {allVisibleEvents.length === 0 && (
                <View style={styles.emptyState}>
                  <IconSymbol name="calendar" size={80} color={currentColors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: currentColors.text }]}>
                    No events available at the moment
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: currentColors.textSecondary }]}>
                    Check back later or ask for an invite link to exclusive events!
                  </Text>
                </View>
              )}

              {allVisibleEvents.map((event) => {
                const isRSVPd = userRSVPs.has(event.id);
                const isRSVPing = rsvpLoading === event.id;
                const isFull = event.availableSpots <= 0;
                const isBanned = bannedEventIds.has(event.id);

                return (
                  <LinearGradient
                    key={event.id}
                    colors={[currentColors.cardGradientStart || currentColors.card, currentColors.cardGradientEnd || currentColors.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.eventCard, { borderColor: currentColors.border }]}
                  >
                    <View style={[styles.imageContainer, { borderColor: currentColors.border }]}>
                      <Image
                        source={{ uri: event.image }}
                        style={styles.eventImage}
                      />
                      <View style={styles.badgeContainer}>
                        {isRSVPd && (
                          <LinearGradient
                            colors={[currentColors.primary, currentColors.highlight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.badge}
                          >
                            <IconSymbol name="checkmark.circle.fill" size={12} color={currentColors.background} />
                            <Text style={[styles.badgeText, { color: currentColors.background }]}>Reserved</Text>
                          </LinearGradient>
                        )}
                        {isBanned && (
                          <LinearGradient
                            colors={['#DC2626', '#B91C1C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.badge}
                          >
                            <IconSymbol name="exclamationmark.triangle.fill" size={12} color="#FFFFFF" />
                            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>Banned</Text>
                          </LinearGradient>
                        )}
                        {event.isPrivate && !event.isInviteOnly && (
                          <LinearGradient
                            colors={[currentColors.secondary, currentColors.highlight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.badge}
                          >
                            <IconSymbol name="lock.fill" size={12} color={currentColors.background} />
                            <Text style={[styles.badgeText, { color: currentColors.background }]}>Private Event</Text>
                          </LinearGradient>
                        )}
                        {event.isInviteOnly && (
                          <LinearGradient
                            colors={[currentColors.primary, currentColors.highlight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.badge}
                          >
                            <IconSymbol name="envelope.fill" size={12} color={currentColors.background} />
                            <Text style={[styles.badgeText, { color: currentColors.background }]}>Invite Only</Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventTitle, { color: currentColors.text }]}>{event.title}</Text>
                      <Text style={[styles.eventDescription, { color: currentColors.textSecondary }]}>
                        {event.description}
                      </Text>

                      {isBanned && (
                        <View style={styles.banNotice}>
                          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#DC2626" />
                          <Text style={styles.banNoticeText}>
                            You have been banned from this event by an administrator and cannot RSVP.
                          </Text>
                        </View>
                      )}

                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetail}>
                          <IconSymbol name="calendar" size={16} color={currentColors.secondary} />
                          <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View style={styles.eventDetail}>
                          <IconSymbol name="location.fill" size={16} color={currentColors.secondary} />
                          <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                            {event.location}
                          </Text>
                        </View>
                        <View style={styles.eventDetail}>
                          <IconSymbol name="person.2.fill" size={16} color={currentColors.secondary} />
                          <Text style={[styles.eventDetailText, { color: currentColors.text }]}>
                            {event.availableSpots} {event.availableSpots === 1 ? 'spot' : 'spots'} left
                          </Text>
                        </View>
                      </View>

                      <View style={styles.buttonRow}>
                        <LinearGradient
                          colors={
                            isRSVPd 
                              ? ['#DC2626', '#B91C1C'] // Red gradient for cancel
                              : isFull || isBanned
                              ? [currentColors.textSecondary, currentColors.textSecondary] 
                              : [currentColors.secondary, currentColors.highlight]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.rsvpButton}
                        >
                          <Pressable
                            style={styles.rsvpButtonInner}
                            onPress={() => isRSVPd ? handleCancelRSVP(event) : handleRSVP(event)}
                            disabled={(!isRSVPd && (isFull || isBanned)) || isRSVPing}
                          >
                            {isRSVPing ? (
                              <ActivityIndicator size="small" color={currentColors.background} />
                            ) : (
                              <Text style={[styles.rsvpButtonText, { color: currentColors.background }]}>
                                {isRSVPd ? 'Cancel Reservation' : isBanned ? 'Banned from Event' : isFull ? 'Event Full' : 'RSVP Now'}
                              </Text>
                            )}
                          </Pressable>
                        </LinearGradient>
                        {event.isInviteOnly && (
                          <Pressable
                            style={[styles.shareButton, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
                            onPress={() => handleShareEvent(event)}
                          >
                            <IconSymbol name="square.and.arrow.up" size={20} color={currentColors.secondary} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Custom Dialog */}
      <Dialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        buttons={dialogConfig.buttons}
        onHide={hideDialog}
        currentColors={currentColors}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 2,
    boxShadow: '0px 6px 20px rgba(74, 215, 194, 0.3)',
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    borderRadius: 0,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  eventCard: {
    borderRadius: 0,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.3)',
    elevation: 8,
  },
  imageContainer: {
    borderBottomWidth: 2,
    overflow: 'hidden',
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
    flexWrap: 'wrap',
    maxWidth: '80%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  banNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  banNoticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#DC2626',
    lineHeight: 18,
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
    fontFamily: 'Inter_400Regular',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    borderRadius: 0,
    boxShadow: '0px 8px 24px rgba(212, 175, 55, 0.4)',
    elevation: 8,
  },
  rsvpButtonInner: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  rsvpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  shareButton: {
    borderRadius: 0,
    padding: 16,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.25)',
    elevation: 4,
  },
});
