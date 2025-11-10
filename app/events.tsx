
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Nigerian Food Festival',
    description: 'Join us for an exclusive tasting event featuring authentic Nigerian dishes including Jollof Rice, Suya, and Puff Puff. Limited spots available!',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Main Location',
    capacity: 50,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    isPrivate: true,
    isInviteOnly: false,
  },
  {
    id: '2',
    title: 'Jollof Rice Masterclass',
    description: 'Learn the secrets of making perfect Nigerian Jollof rice from our head chef. Includes a full meal and recipe booklet.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Kitchen',
    capacity: 20,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    isPrivate: true,
    isInviteOnly: false,
  },
  {
    id: '3',
    title: 'Private Family Dinner',
    description: 'An intimate family-style dinner experience with traditional Nigerian cuisine. This is an invite-only event.',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Jagabans LA Private Dining',
    capacity: 30,
    attendees: [],
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    isPrivate: false,
    isInviteOnly: true,
    shareableLink: 'jagabansla://event/3?token=abc123',
  },
];

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userProfile, addNotification, currentColors } = useApp();
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [accessedInviteEvents, setAccessedInviteEvents] = useState<string[]>([]);

  useEffect(() => {
    console.log('Events screen params:', params);
    
    // Check if user accessed via invite link
    if (params.eventId && params.token) {
      const eventId = params.eventId as string;
      if (!accessedInviteEvents.includes(eventId)) {
        setAccessedInviteEvents([...accessedInviteEvents, eventId]);
      }
    }

    // Filter events based on visibility rules
    const filtered = mockEvents.filter((event) => {
      // Private Events (open to all app members)
      if (event.isPrivate && !event.isInviteOnly) {
        return true;
      }
      // Invite Only Events (only visible if accessed via link)
      if (event.isInviteOnly) {
        return accessedInviteEvents.includes(event.id);
      }
      return false;
    });

    setVisibleEvents(filtered);
  }, [params, accessedInviteEvents]);

  const handleRSVP = (event: Event) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isAlreadyRSVPd = userProfile.rsvpEvents.includes(event.id);
    
    if (isAlreadyRSVPd) {
      Alert.alert('Already RSVP&apos;d', 'You have already secured your spot for this event!');
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
          onPress: () => {
            const notification = {
              id: Date.now().toString(),
              title: 'RSVP Confirmed!',
              message: `Your spot for "${event.title}" has been secured. We'll send you a reminder closer to the date.`,
              type: 'event' as const,
              date: new Date().toISOString(),
              read: false,
              actionUrl: '/events',
            };
            addNotification(notification);
            Alert.alert('Success!', 'Your RSVP has been confirmed. Check your notifications for details.');
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
      Alert.alert('Cannot Share', 'Only Invite Only events can be shared with specific people.');
      return;
    }

    const shareLink = event.shareableLink || `jagabansla://event/${event.id}?token=${Date.now()}`;
    const message = `You're invited to ${event.title} at Jagabans LA!\n\n${event.description}\n\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\n\nAccess the event: ${shareLink}`;

    try {
      const result = await Share.share({
        message,
        title: `Invitation: ${event.title}`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success!', 'Event invitation shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Error', 'Failed to share event. Please try again.');
    }
  };

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
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Events</Text>
          <View style={{ width: 24 }} />
        </View>

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

          {visibleEvents.length === 0 && (
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

          {visibleEvents.map((event) => {
            const spotsLeft = event.capacity - event.attendees.length;
            const isRSVPd = userProfile.rsvpEvents.includes(event.id);

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
                      disabled={spotsLeft <= 0}
                    >
                      <Text style={[styles.rsvpButtonText, { color: currentColors.card }]}>
                        {isRSVPd ? 'RSVP Confirmed' : spotsLeft <= 0 ? 'Event Full' : 'RSVP Now'}
                      </Text>
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
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 16,
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
    borderRadius: 16,
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
