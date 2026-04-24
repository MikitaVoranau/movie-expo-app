import { ThemeProvider as NavigationThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';
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
    <ThemeProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigation() {
  const { colorScheme } = useContext(ThemeContext);
  const navTheme = colorScheme === 'dark' ? CinemaDarkNavTheme : CinemaLightNavTheme;

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="collection/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
