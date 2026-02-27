import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

import { GradientOverlay } from '@/components/gradient-overlay';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Spacing } from '@/constants/theme';
import { backdropUrl } from '@/services/tmdb';
import type { TmdbMovie } from '@/services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = SCREEN_WIDTH * 0.65;

interface HeroBannerProps {
  movie: TmdbMovie;
}

export function HeroBanner({ movie }: HeroBannerProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/movie/${movie.id}`)} style={styles.container}>
      <Image
        source={{ uri: backdropUrl(movie.backdrop_path) }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <GradientOverlay />
      <View style={styles.content}>
        <ThemedText type="heading" style={styles.title} numberOfLines={2}>
          {movie.title}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText type="caption" style={styles.meta}>
            {movie.release_date?.slice(0, 4)}
          </ThemedText>
          <View style={styles.ratingChip}>
            <IconSymbol name="star.fill" size={12} color="#FFD700" />
            <ThemedText type="badge" style={styles.ratingText}>
              {movie.vote_average.toFixed(1)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.trailerButton}>
          <IconSymbol name="play.fill" size={16} color="#FFFFFF" />
          <ThemedText type="badge" style={styles.trailerText}>Trailer</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    marginBottom: Spacing.md,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
  },
  content: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
  },
  title: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  meta: {
    color: '#CCCCCC',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#FFD700',
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E50914',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  trailerText: {
    color: '#FFFFFF',
  },
});
