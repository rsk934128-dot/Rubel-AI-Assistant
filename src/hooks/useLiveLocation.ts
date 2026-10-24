import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface AddressDetails {
  display_name?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface UseLiveLocationReturn {
  coordinates: LocationCoordinates | null;
  address: string | null;
  addressDetails: AddressDetails | null;
  isTracking: boolean;
  isLoading: boolean;
  isResolvingAddress: boolean;
  error: string | null;
  permissionState: 'granted' | 'prompt' | 'denied' | 'unsupported';
  updateCount: number;
  lastUpdated: Date | null;
  startTracking: () => void;
  stopTracking: () => void;
  refreshLocation: () => Promise<void>;
  googleMapsUrl: string | null;
}

export function useLiveLocation(): UseLiveLocationReturn {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastGeocodedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check initial permission status if browser supports navigator.permissions
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setError('আপনার ব্রাউজারে Geolocation (GPS) সুবিধা সমর্থিত নয়।');
      return;
    }

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permission) => {
          setPermissionState(permission.state as 'granted' | 'prompt' | 'denied');
          permission.onchange = () => {
            setPermissionState(permission.state as 'granted' | 'prompt' | 'denied');
          };
        })
        .catch(() => {
          // Fallback if query fails
        });
    }
  }, []);

  // Reverse Geocode using OpenStreetMap Nominatim with language preference bn,en
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    // Only reverse-geocode if moved by more than ~150 meters from last call to preserve rate limits
    if (lastGeocodedCoordsRef.current) {
      const dLat = Math.abs(lastGeocodedCoordsRef.current.lat - lat);
      const dLng = Math.abs(lastGeocodedCoordsRef.current.lng - lng);
      if (dLat < 0.0015 && dLng < 0.0015) {
        return;
      }
    }

    lastGeocodedCoordsRef.current = { lat, lng };

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsResolvingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=bn,en`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Address lookup response failed');
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);
        setAddressDetails(data.address || null);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Reverse geocoding warning:', err);
      }
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const coords: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setCoordinates(coords);
      setLastUpdated(new Date(position.timestamp));
      setUpdateCount((c) => c + 1);
      setIsLoading(false);
      setError(null);
      setPermissionState('granted');

      // Trigger address lookup
      reverseGeocode(coords.latitude, coords.longitude);
    },
    [reverseGeocode]
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    setIsLoading(false);
    let msg = 'লাইভ লোকেশন পেতে ব্যর্থ হয়েছে।';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        msg = 'লোকেশন পারমিশন প্রত্যাখ্যাত হয়েছে। ব্রাউজারের অ্যাড্রেস বারে গিয়ে লোকেশন পারমিশন Allow বা চালু করুন।';
        setPermissionState('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        msg = 'GPS বা নেটওয়ার্ক থেকে লোকেশন সংকেত পাওয়া যাচ্ছে না। আপনার ডিভাইসের Location/GPS সার্ভিস অন আছে কি না নিশ্চিত করুন।';
        break;
      case err.TIMEOUT:
        msg = 'লোকেশন পেতে সময় বেশি লেগেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        break;
      default:
        msg = err.message || 'অজ্ঞাত কারণে লোকেশন পাওয়া যায়নি।';
        break;
    }

    setError(msg);
  }, []);

  // Start continuous watchPosition
  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('আপনার ব্রাউজারে Geolocation (GPS) প্রযুক্তি সমর্থিত নয়।');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsTracking(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // High accuracy watch with 15s timeout
    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );

    watchIdRef.current = id;
  }, [handlePositionSuccess, handlePositionError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsLoading(false);
  }, []);

  // One-time refresh / fetch
  const refreshLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation সমর্থিত নয়।');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionSuccess(pos);
      },
      (err) => {
        handlePositionError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const googleMapsUrl = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    : null;

  return {
    coordinates,
    address,
    addressDetails,
    isTracking,
    isLoading,
    isResolvingAddress,
    error,
    permissionState,
    updateCount,
    lastUpdated,
    startTracking,
    stopTracking,
    refreshLocation,
    googleMapsUrl,
  };
}
