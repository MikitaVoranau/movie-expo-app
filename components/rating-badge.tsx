import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface RatingBadgeProps {
  rating: number;
  size?: number;
}

export function RatingBadge({ rating, size = 56 }: RatingBadgeProps) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText style={styles.number}>{rating.toFixed(1)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
