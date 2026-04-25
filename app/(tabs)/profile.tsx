import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GenreStats } from '@/components/genre-stats';
import { ListCard } from '@/components/list-card';
import { MovieCard } from '@/components/movie-card';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useUserProfile } from '@/context/auth-context';
import { getCollectionItems, getCollections, getListItems, getWatchedGenreStats } from '@/db/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCollections, useListCounts, useListItems } from '@/hooks/use-database';
import { useMovieGenres } from '@/hooks/use-tmdb';
import type { TmdbMovie } from '@/services/types';

const GENRE_COLORS = ['#E50914', '#FFD700', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#795548'];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = Colors[colorScheme];
  const { profile } = useUserProfile();

  const { items: watchlist, refresh: refreshWatchlist } = useListItems('watchlist');
  const { items: watched, refresh: refreshWatched } = useListItems('watched');
  const { counts, refresh: refreshCounts } = useListCounts();
  const { collections, refresh: refreshCollections, create: createCol, remove: removeCol } = useCollections();
  const { data: genres } = useMovieGenres();

  const [favorites, setFavorites] = useState<{ poster_url: string | null }[]>([]);
  const [collectionPosters, setCollectionPosters] = useState<Record<number, (string | undefined)[]>>({});
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched'>('watchlist');
  const [genreStats, setGenreStats] = useState<{ genre: string; percentage: number; color: string }[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshGenreStats = useCallback(async () => {
    if (genres.length === 0) return;
    const { counts: genreCounts, totalMovies } = await getWatchedGenreStats();
    const genreMap = new Map(genres.map((g) => [g.id, g.name]));
    
    if (totalMovies === 0) {
      setGenreStats([]);
      return;
    }
    
    const entries = Object.entries(genreCounts)
      .map(([idStr, count]) => ({
        id: Number(idStr),
        name: genreMap.get(Number(idStr)) ?? `Genre ${idStr}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const stats = entries.map((e, i) => ({
      genre: e.name,
      percentage: Math.round((e.count / totalMovies) * 100),
      color: GENRE_COLORS[i % GENRE_COLORS.length],
    }));
    setGenreStats(stats);
  }, [genres]);

  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        await refreshWatchlist();
        await refreshWatched();
        await refreshCounts();
        await refreshCollections();
        const favs = await getListItems('favorites');
        setFavorites(favs);
        refreshGenreStats();

        setCollectionPosters({});
        const result: Record<number, (string | undefined)[]> = {};
        const allCollections = await getCollections();
        for (const col of allCollections) {
          const items = await getCollectionItems(col.id);
          result[col.id] = items.slice(0, 4).map((item) => item.poster_url ?? undefined);
        }
        setCollectionPosters(result);
        setRefreshKey((k) => k + 1);
      };
      refreshData();
    }, [refreshGenreStats])
  );

  const toMovieData = (item: { movie_id: number; title: string; poster_url: string | null }) =>
    ({
      id: item.movie_id,
      title: item.title,
      poster_path: item.poster_url?.split('/p/w500')[1] ?? null,
      vote_average: 0,
      genre_ids: [],
    }) as unknown as TmdbMovie;

  const activeItems = activeTab === 'watchlist' ? watchlist : watched;

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    await createCol(name);
    setNewCollectionName('');
    setCreateModalVisible(false);
  };

  const handleDeleteCollection = (id: number, name: string) => {
    if (Platform.OS === 'web') {
      if (confirm(t('profile.deleteConfirm', { name }))) {
        removeCol(id);
      }
    } else {
      Alert.alert(
        t('profile.deleteCollection'),
        t('profile.deleteConfirm', { name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.deleteCollection'), style: 'destructive', onPress: () => removeCol(id) },
        ]
      );
    }
  };

  const collectionsData = [
    {
      key: 'favorites',
      title: t('profile.favorites'),
      count: favorites.length,
      posters: favorites.slice(0, 4).map((f) => f.poster_url ?? undefined),
      onPress: () => router.push('/collection/favorites' as any),
      onLongPress: undefined as (() => void) | undefined,
    },
    ...collections.map((col) => ({
      key: `col-${col.id}`,
      title: col.name,
      count: collectionPosters[col.id]?.filter(Boolean).length ?? 0,
      posters: collectionPosters[col.id] ?? [],
      onPress: () => router.push(`/collection/${col.id}` as any),
      onLongPress: () => handleDeleteCollection(col.id, col.name),
    })),
  ];

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.xl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.settingsButton, { top: insets.top + Spacing.sm }]}
        >
          <IconSymbol name="gear" size={24} color={theme.icon} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.avatarRing, { borderColor: theme.accent }]}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.surfaceVariant }]}>
                <IconSymbol name="person.fill" size={40} color={theme.textMuted} />
              </View>
            )}
          </View>
          <ThemedText type="heading">{profile.username}</ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="heading" style={styles.statValue}>
                {counts.watched ?? 0}
              </ThemedText>
              <ThemedText type="caption">{t('profile.filmsWatched')}</ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="heading" style={styles.statValue}>
                {Math.round((counts.watched ?? 0) * 1.8)}
              </ThemedText>
              <ThemedText type="caption">{t('profile.hoursWatched')}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('watchlist')}
            style={[styles.tab, activeTab === 'watchlist' && { borderBottomColor: theme.accent }]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: activeTab === 'watchlist' ? theme.accent : theme.textMuted }}
            >
              {t('profile.willWatch')}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('watched')}
            style={[styles.tab, activeTab === 'watched' && { borderBottomColor: theme.accent }]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: activeTab === 'watched' ? theme.accent : theme.textMuted }}
            >
              {t('profile.history')}
            </ThemedText>
          </Pressable>
        </View>

        {activeItems.length > 0 ? (
          <FlatList
            horizontal
            data={activeItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MovieCard movie={toMovieData(item)} />}
            contentContainerStyle={{ paddingHorizontal: Spacing.md }}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <ThemedText type="caption">
              {activeTab === 'watchlist' ? t('profile.emptyWatchlist') : t('profile.emptyHistory')}
            </ThemedText>
          </View>
        )}

        <View style={styles.collectionsHeader}>
          <SectionHeader title={t('profile.collections')} />
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={[styles.addCollectionButton, { backgroundColor: theme.surface }]}
          >
            <IconSymbol name="plus" size={18} color={theme.accent} />
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={collectionsData}
          keyExtractor={(item) => item.key}
          extraData={refreshKey}
          renderItem={({ item }) => (
            <ListCard
              title={item.title}
              count={item.count}
              posters={item.posters}
              onPress={item.onPress}
              onLongPress={item.onLongPress}
              refreshKey={refreshKey}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: Spacing.md }}
          showsHorizontalScrollIndicator={false}
        />

        <SectionHeader title={t('profile.stats')} />
        {genreStats.length > 0 ? (
          <GenreStats stats={genreStats} />
        ) : (
          <View style={styles.emptyState}>
            <ThemedText type="caption">{t('profile.noGenreStats')}</ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCreateModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="title" style={styles.modalTitle}>
              {t('profile.newCollection')}
            </ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.border,
                },
              ]}
              placeholder={t('profile.collectionName')}
              placeholderTextColor={theme.textMuted}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
              onSubmitEditing={handleCreateCollection}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  setNewCollectionName('');
                  setCreateModalVisible(false);
                }}
              >
                <ThemedText style={{ color: theme.textMuted }}>{t('common.cancel')}</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.accent }]}
                onPress={handleCreateCollection}
              >
                <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
                  {t('profile.create')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
  },
  divider: {
    width: 1,
    height: 40,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  collectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCollectionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  modalButtonPrimary: {
    minWidth: 80,
    alignItems: 'center',
  },
});
