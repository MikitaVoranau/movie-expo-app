import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type ViewStyle } from 'react-native';

interface GradientOverlayProps {
  colors?: [string, string, ...string[]];
  locations?: number[];
  style?: ViewStyle;
}

export function GradientOverlay({
  colors = ['transparent', 'rgba(15,15,15,0.8)', '#0F0F0F'],
  locations = [0, 0.6, 1],
  style,
}: GradientOverlayProps) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}
