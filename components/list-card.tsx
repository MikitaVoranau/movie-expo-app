import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ListCardProps {
  title: string;
  count: number;
  posters: (string | undefined)[];
  onPress: () => void;
  onLongPress?: () => void;
  refreshKey?: number;
}

const CARD_SIZE = 140;

export function ListCard({ title, count, posters, onPress, onLongPress, refreshKey }: ListCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const timestamp = refreshKey ?? 0;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={styles.posterGrid}>
        {[0, 1, 2, 3].map((i) => (
          <Image
            key={`${i}-${timestamp}`}
            source={posters[i] ? { uri: `${posters[i]}?t=${timestamp}` } : undefined}
            style={[styles.posterThumb, { backgroundColor: theme.surfaceVariant }]}
            contentFit="cover"
          />
        ))}
      </View>
      <View style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="caption">{count} films</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  posterGrid: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  posterThumb: {
    width: CARD_SIZE / 2,
    height: CARD_SIZE / 2,
  },
  infoContainer: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
  },
});
