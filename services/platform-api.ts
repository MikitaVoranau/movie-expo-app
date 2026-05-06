// Platform API Service - Location
import * as Location from 'expo-location';

// ============================================
// CAMERA SERVICE
// ============================================
// Камера используется через expo-image-picker (уже реализовано в imagekit-signed.ts)
// Дополнительные функции для камеры можно добавить здесь

// ============================================
// LOCATION SERVICE
// ============================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
}

/**
 * Запрашивает разрешение на доступ к геолокации
 * @returns true если разрешение получено
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Получает текущую геолокацию пользователя
 * @returns объект с координатами или null если нет доступа
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    // Проверяем разрешения
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission not granted, requesting...');
      const granted = await requestLocationPermission();
      if (!granted) {
        console.error('Location permission denied by user');
        return null;
      }
    }

    console.log('Getting current location...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    console.log('Location obtained:', location.coords);
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      timestamp: location.timestamp,
    };
  } catch (error: any) {
    console.error('Error getting location:', error);
    
    // Более подробные сообщения об ошибках
    if (error.code === 'E_LOCATION_UNAVAILABLE') {
      console.error('Location services are disabled or unavailable');
    } else if (error.code === 'E_LOCATION_TIMEOUT') {
      console.error('Location request timed out');
    } else if (error.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
      console.error('Location settings are not satisfied');
    }
    
    return null;
  }
}

/**
 * Получает адрес по координатам (обратное геокодирование)
 * @param latitude широта
 * @param longitude долгота
 * @returns массив адресов или пустой массив
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Location.LocationGeocodedAddress[]> {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    return addresses;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return [];
  }
}
