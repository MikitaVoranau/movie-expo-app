import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';

import { BorderRadius } from '@/constants/theme';

interface GlassCardProps {
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 20 }: PropsWithChildren<GlassCardProps>) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="dark" style={[styles.card, style]}>
        {children}
      </BlurView>
    );
  }

  // Android/web fallback
  return (
    <View style={[styles.card, styles.fallback, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: 'rgba(30,30,30,0.85)',
  },
});
