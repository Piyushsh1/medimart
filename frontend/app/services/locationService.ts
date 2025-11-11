import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

class LocationService {
  private hasPermission: boolean = false;

  /**
   * Request location permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby pharmacies and auto-fill your address.',
          [{ text: 'OK' }]
        );
        this.hasPermission = false;
        return false;
      }

      this.hasPermission = true;
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location of the user
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coords: LocationCoords): Promise<AddressComponents | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        
        // Build formatted address
        const parts = [
          address.street,
          address.streetNumber,
          address.district,
          address.subregion,
        ].filter(Boolean);
        
        return {
          street: address.street || address.name || '',
          city: address.city || address.subregion || '',
          region: address.region || '',
          country: address.country || '',
          postalCode: address.postalCode || '',
          formattedAddress: parts.join(', '),
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    coords1: LocationCoords,
    coords2: LocationCoords
  ): number {
    const R = 6371; // Earth's radius in km

    const lat1 = this.toRadians(coords1.latitude);
    const lat2 = this.toRadians(coords2.latitude);
    const deltaLat = this.toRadians(coords2.latitude - coords1.latitude);
    const deltaLon = this.toRadians(coords2.longitude - coords1.longitude);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Watch user location for real-time updates
   */
  async watchLocation(
    callback: (location: LocationCoords) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 100, // Or when moved 100 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }
}

export default new LocationService();
