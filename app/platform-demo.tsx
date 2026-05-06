import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    getCurrentLocation,
    requestLocationPermission,
    reverseGeocode,
    type LocationData,
} from '@/services/platform-api';

export default function PlatformDemoScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = Colors[colorScheme];

  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        
        // Получаем адрес
        const addresses = await reverseGeocode(loc.latitude, loc.longitude);
        if (addresses.length > 0) {
          const addr = addresses[0];
          const parts = [
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } else {
        Alert.alert(
          'Location Error',
          'Could not get location. Please check:\n\n' +
          '1. Location permissions are granted\n' +
          '2. Location services are enabled\n' +
          '3. You are using a real device or emulator with location set\n\n' +
          'For emulator: Set location in simulator settings'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Check console for details.');
      console.error('Location error:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleRequestLocationPermission = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      Alert.alert('Success', 'Location permission granted!');
    } else {
      Alert.alert('Denied', 'Location permission denied');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.xl }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.icon} />
        </Pressable>
        <ThemedText type="title">Platform API Demo</ThemedText>
      </View>

      {/* LOCATION SECTION */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          📍 Geolocation
        </ThemedText>
        
        <Pressable
          onPress={handleRequestLocationPermission}
          style={[styles.button, { backgroundColor: theme.accent }]}
        >
          <ThemedText style={{ color: '#FFF' }}>Request Permission</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleGetLocation}
          style={[styles.button, { backgroundColor: theme.accent }]}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={{ color: '#FFF' }}>Get Current Location</ThemedText>
          )}
        </Pressable>

        {location && (
          <View style={styles.dataBox}>
            <ThemedText type="caption" style={{ color: theme.textMuted }}>
              Latitude: {location.latitude.toFixed(6)}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textMuted }}>
              Longitude: {location.longitude.toFixed(6)}
            </ThemedText>
            {location.accuracy && (
              <ThemedText type="caption" style={{ color: theme.textMuted }}>
                Accuracy: ±{location.accuracy.toFixed(0)}m
              </ThemedText>
            )}
            {address && (
              <ThemedText type="caption" style={{ color: theme.textMuted, marginTop: Spacing.sm }}>
                📍 {address}
              </ThemedText>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dataBox: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
