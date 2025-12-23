// Jagabans L.A. Restaurant Location
// Replace with actual restaurant coordinates
export const RESTAURANT_LOCATION = {
  latitude: 34.0522, // Los Angeles latitude (replace with actual)
  longitude: -118.2437, // Los Angeles longitude (replace with actual)
  name: 'Jagabans L.A.',
  address: '123 Restaurant Street, Los Angeles, CA 90001', // Replace with actual
};

// Geofence radius in meters (e.g., 100 meters = ~328 feet)
export const GEOFENCE_RADIUS_METERS = 100;

// Alias for consistency with social features
export const JAGABANS_LOCATION = {
  latitude: RESTAURANT_LOCATION.latitude,
  longitude: RESTAURANT_LOCATION.longitude,
  radius: GEOFENCE_RADIUS_METERS,
};

// Function to calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if a location is within the geofence
export function isWithinGeofence(
  userLat: number,
  userLon: number
): boolean {
  const distance = calculateDistance(
    userLat,
    userLon,
    RESTAURANT_LOCATION.latitude,
    RESTAURANT_LOCATION.longitude
  );
  return distance <= GEOFENCE_RADIUS_METERS;
}

// Referral bonus configuration
export const REFERRAL_CONFIG = {
  signupBonusPoints: 50, // Points awarded when referred user signs up
  firstOrderBonusPoints: 100, // Points awarded when referred user completes first order
};
