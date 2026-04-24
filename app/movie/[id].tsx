import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientOverlay } from '@/components/gradient-overlay';
import { MovieCard } from '@/components/movie-card';
import { RatingBadge } from '@/components/rating-badge';
import { ReviewCard } from '@/components/review-card';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { addToCollection, addToList } from '@/db/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCollections, useIsInList } from '@/hooks/use-database';
import { useMovieDetail } from '@/hooks/use-tmdb';
import { backdropUrl, posterUrl } from '@/services/tmdb';

const HEADER_HEIGHT = 350;

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];

  const { movie, videos, reviews, watchProviders, similar, loading } = useMovieDetail(
    Number(id)
  );
  const { inList: isBookmarked, toggle: toggleBookmark } = useIsInList(Number(id), 'watchlist');
  const { inList: isLiked, toggle: toggleLike } = useIsInList(Number(id), 'favorites');
  const { collections, refresh: refreshCollections } = useCollections();
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);


  useEffect(() => {
    if (movie) {
      const genreIds = movie.genres?.map((g) => g.id) ?? movie.genre_ids ?? [];
      const saveMovie = async () => {
        await addToList({
          movie_id: movie.id,
          title: movie.title,
          poster_url: posterUrl(movie.poster_path) ?? null,
          list_type: 'watched',
          rating: null,
          notes: JSON.stringify({ genre_ids: genreIds }),
        });
      };
      saveMovie();
    }
  }, [movie?.id, movie?.genres]);

  if (loading || !movie) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube');

  const openTrailer = () => {
    if (trailer) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
    }
  };

  const handleAddToCollection = () => {
    refreshCollections();
    setCollectionModalVisible(true);
  };

  const handleSelectCollection = async (collectionId: number) => {
    await addToCollection(collectionId, {
      movie_id: movie.id,
      title: movie.title,
      poster_url: posterUrl(movie.poster_path) ?? null,
    });
    setCollectionModalVisible(false);
  };

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.header}>
          <Image
            source={{ uri: backdropUrl(movie.backdrop_path) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <GradientOverlay />

          {}
          <Pressable
            onPress={() => router.back()}
            style={[styles.headerButton, styles.backButton, { top: insets.top + Spacing.sm, left: Spacing.md }]}
          >
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={[styles.headerActions, { top: insets.top + Spacing.sm, right: Spacing.md }]}>
            <Pressable
              onPress={() =>
                toggleLike({
                  title: movie.title,
                  poster_url: posterUrl(movie.poster_path) ?? null,
                })
              }
              style={styles.headerButton}
            >
              <IconSymbol
                name="heart.fill"
                size={22}
                color={isLiked ? '#E50914' : '#FFFFFF'}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                toggleBookmark({
                  title: movie.title,
                  poster_url: posterUrl(movie.poster_path) ?? null,
                })
              }
              style={styles.headerButton}
            >
              <IconSymbol
                name={isBookmarked ? 'bookmark.fill' : 'bookmark'}
                size={22}
                color={isBookmarked ? '#FFD700' : '#FFFFFF'}
              />
            </Pressable>
          </View>
        </View>

        {}
        <View style={styles.content}>
          {}
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <ThemedText type="heading">{movie.title}</ThemedText>
            </View>
            <RatingBadge rating={movie.vote_average} />
          </View>

          {}
          <View style={styles.actionRow}>
            {trailer && (
              <Pressable style={styles.trailerButton} onPress={openTrailer}>
                <IconSymbol name="play.fill" size={18} color="#FFFFFF" />
                <ThemedText type="badge" style={{ color: '#FFFFFF' }}>
                  {t('discovery.trailer')}
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              style={[styles.collectionButton, { backgroundColor: theme.surface }]}
              onPress={handleAddToCollection}
            >
              <IconSymbol name="plus" size={18} color={theme.text} />
              <ThemedText type="badge">{t('movie.addToCollection')}</ThemedText>
            </Pressable>
          </View>

          {}
          <SectionHeader title={t('movie.synopsis')} />
          <ThemedText style={styles.synopsis}>{movie.overview}</ThemedText>

          {}
          {watchProviders && (
            <>
              <SectionHeader title={t('movie.whereToWatch')} />
              <View style={styles.providers}>
                {[
                  ...(watchProviders.flatrate ?? []),
                  ...(watchProviders.rent ?? []),
                  ...(watchProviders.buy ?? []),
                ]
                  .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
                  .slice(0, 8)
                  .map((provider) => (
                    <View key={provider.provider_id} style={styles.providerItem}>
                      <Image
                        source={{ uri: posterUrl(provider.logo_path, 'w92') }}
                        style={styles.providerLogo}
                        contentFit="cover"
                      />
                      <ThemedText type="caption" numberOfLines={1} style={styles.providerName}>
                        {provider.provider_name}
                      </ThemedText>
                    </View>
                  ))}
              </View>
            </>
          )}

          {}
          {reviews.length > 0 && (
            <>
              <SectionHeader title={t('movie.reviews')} />
              {reviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </>
          )}

          {}
          {similar.length > 0 && (
            <>
              {}
              <View style={styles.infoRow}>
                <View style={styles.infoChip}>
                  <IconSymbol name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText type="caption">{movie.release_date?.slice(0, 4)}</ThemedText>
                </View>
                <View style={styles.infoChip}>
                  <IconSymbol name="clock" size={14} color={theme.textSecondary} />
                  <ThemedText type="caption">{movie.runtime} {t('movie.minutes')}</ThemedText>
                </View>
                {movie.genres[0] && (
                  <View style={styles.infoChip}>
                    <IconSymbol name="film" size={14} color={theme.textSecondary} />
                    <ThemedText type="caption">{movie.genres[0].name}</ThemedText>
                  </View>
                )}
              </View>
              <SectionHeader title={t('movie.similar')} />
              <FlatList
                horizontal
                data={similar}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <MovieCard movie={item} />}
                contentContainerStyle={{ paddingHorizontal: Spacing.md }}
                showsHorizontalScrollIndicator={false}
              />
            </>
          )}

          <View style={{ height: Spacing.xl * 2 }} />
        </View>
      </ScrollView>

      {}
      <Modal
        visible={collectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCollectionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCollectionModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="title" style={styles.modalTitle}>
              {t('movie.selectCollection')}
            </ThemedText>
            {collections.length === 0 ? (
              <ThemedText type="caption" style={styles.modalEmpty}>
                {t('movie.noCollections')}
              </ThemedText>
            ) : (
              collections.map((col) => (
                <Pressable
                  key={col.id}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleSelectCollection(col.id)}
                >
                  <IconSymbol name="folder" size={20} color={theme.textSecondary} />
                  <ThemedText style={styles.modalItemText}>{col.name}</ThemedText>
                </Pressable>
              ))
            )}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setCollectionModalVisible(false)}
            >
              <ThemedText type="defaultSemiBold" style={{ color: theme.accent }}>
                {t('common.cancel')}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: HEADER_HEIGHT,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
  },
  headerActions: {
    position: 'absolute',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  content: {
    marginTop: -Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E50914',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  synopsis: {
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
  providers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  providerItem: {
    alignItems: 'center',
    width: 60,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
  },
  providerName: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  modalEmpty: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    flex: 1,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
});
