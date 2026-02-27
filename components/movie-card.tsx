import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { posterUrl } from '@/services/tmdb';
import type { TmdbMovie } from '@/services/types';

interface MovieCardProps {
  movie: TmdbMovie;
  width?: number;
  onLongPress?: () => void;
}

export function MovieCard({ movie, width = 170, onLongPress }: MovieCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const height = width * 1.5;

  return (
    <Pressable
      onPress={() => router.push(`/movie/${movie.id}`)}
      onLongPress={onLongPress}
      style={[styles.container, { width }]}
    >
      <Image
        source={{ uri: posterUrl(movie.poster_path) }}
        style={[styles.poster, { width, height, borderRadius: BorderRadius.sm }]}
        contentFit="cover"
        transition={200}
      />
      <ThemedText numberOfLines={2} style={[styles.title, { color: theme.text }]}>
        {movie.title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.xs,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  poster: {
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
