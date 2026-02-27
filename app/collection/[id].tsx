import { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MovieCard } from '@/components/movie-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCollectionItems, getCollections, getListItems, removeFromList } from '@/db/database';
import type { UserListItem, UserCollection } from '@/db/database';
import type { TmdbMovie } from '@/services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - COLUMN_GAP) / 2;

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];

  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [movies, setMovies] = useState<UserListItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (id === 'favorites') {
        setCollection({ id: 0, name: t('profile.favorites'), created_at: '' });
        const items = await getListItems('favorites');
        setMovies(items);
      } else {
        const collections = await getCollections();
        const col = collections.find((c) => c.id === Number(id));
        setCollection(col ?? null);

        const items = await getCollectionItems(Number(id));
        setMovies(items);
      }
    };
    loadData();
  }, [id, t]);

  const handleDeleteMovie = (movieId: number, title: string) => {
    const listType = id === 'favorites' ? 'favorites' : `collection:${id}`;
    
    if (Platform.OS === 'web') {
      if (confirm(`Delete "${title}"?`)) {
        removeFromList(movieId, listType).then(() => {
          setMovies((prev) => prev.filter((m) => m.movie_id !== movieId));
        });
      }
    } else {
      Alert.alert(
        'Delete Movie',
        `Delete "${title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeFromList(movieId, listType).then(() => {
                setMovies((prev) => prev.filter((m) => m.movie_id !== movieId));
              });
            },
          },
        ]
      );
    }
  };

  const toMovieData = (item: UserListItem): TmdbMovie =>
    ({
      id: item.movie_id,
      title: item.title,
      poster_path: item.poster_url?.split('/p/w500')[1] ?? null,
      vote_average: 0,
      genre_ids: [],
      original_title: item.title,
      overview: '',
      backdrop_path: null,
      release_date: '',
    }) as unknown as TmdbMovie;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          {collection?.name ?? t('profile.collections')}
        </ThemedText>
      </View>

      {movies.length > 0 ? (
        <FlatList
          data={movies}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          renderItem={({ item }) => (
            <MovieCard
              movie={toMovieData(item)}
              width={CARD_WIDTH}
              onLongPress={() => handleDeleteMovie(item.movie_id, item.title)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <View style={styles.emptyState}>
          <ThemedText type="caption">{t('profile.emptyHistory')}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
