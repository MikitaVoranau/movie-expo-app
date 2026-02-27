import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { posterUrl } from '@/services/tmdb';
import type { TmdbMovie } from '@/services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieGridProps {
  movies: TmdbMovie[];
  loading?: boolean;
  onEndReached?: () => void;
}

export function MovieGrid({ movies, loading, onEndReached }: MovieGridProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <FlatList
      data={movies}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? <ActivityIndicator color={theme.accent} style={styles.loader} /> : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/movie/${item.id}`)}
          style={styles.card}
        >
          <Image
            source={{ uri: posterUrl(item.poster_path) }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
          <ThemedText numberOfLines={1} style={styles.title}>
            {item.title}
          </ThemedText>
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={11} color={theme.accentGold} />
            <ThemedText type="caption">{item.vote_average.toFixed(1)}</ThemedText>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: Spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
  },
  poster: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.md,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  loader: {
    paddingVertical: Spacing.md,
  },
});
