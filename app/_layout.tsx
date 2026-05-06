import { ThemeProvider as NavigationThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useUserProfile } from '@/context/auth-context';
import { NetworkProvider } from '@/context/network-context';
import { ThemeContext, ThemeProvider } from '@/context/theme-context';
import { initDatabase } from '@/db/database';
import '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CinemaDarkNavTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

const CinemaLightNavTheme: Theme = {
  dark: false,
  colors: {
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!dbReady) return null;

  return (
    <NetworkProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </ThemeProvider>
    </NetworkProvider>
  );
}

function RootNavigation() {
  const { colorScheme } = useContext(ThemeContext);
  const { firebaseUid, isAnonymous } = useUserProfile();
  const segments = useSegments();
  const router = useRouter();
  const navTheme = colorScheme === 'dark' ? CinemaDarkNavTheme : CinemaLightNavTheme;

  // Проверяем аутентификацию и перенаправляем
  useEffect(() => {
    if (!firebaseUid) return; // Ждём инициализации

    const inAuthGroup = segments[0] === 'auth';

    // Если пользователь анонимный и не на экране auth - перенаправляем на auth
    if (isAnonymous && !inAuthGroup) {
      router.replace('/auth');
    }
    // Если пользователь залогинен и на экране auth - перенаправляем на главную
    else if (!isAnonymous && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [firebaseUid, isAnonymous, segments]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        <Stack.Screen name="platform-demo" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
