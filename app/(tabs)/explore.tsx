import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips } from '@/components/filter-chips';
import { MovieGrid } from '@/components/movie-grid';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDiscover, useMovieGenres, useSearch } from '@/hooks/use-tmdb';
import { fuzzyFilter } from '@/utils/fuzzy-search';

type SortOption = 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'release_date.asc';

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'popularity.desc', labelKey: 'search.sortPopularity' },
  { value: 'vote_average.desc', labelKey: 'search.sortRating' },
  { value: 'release_date.desc', labelKey: 'search.sortNewest' },
  { value: 'release_date.asc', labelKey: 'search.sortOldest' },
];

const YEAR_OPTIONS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010, 2000];

const RATING_OPTIONS = [
  { label: '9+', value: 9 },
  { label: '8+', value: 8 },
  { label: '7+', value: 7 },
  { label: '6+', value: 6 },
];

export default function SearchScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popularity.desc');
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { data: genres } = useMovieGenres();
  const { data: searchResults, loading: searchLoading } = useSearch(debouncedQuery);

  const discoverFilters = useMemo(() => {
    const f: Record<string, string> = { sort_by: sortBy };
    if (filterYear) {
      f['primary_release_year'] = String(filterYear);
    }
    if (filterRating) {
      f['vote_average.gte'] = String(filterRating);
      f['vote_count.gte'] = '100';
    }
    return f;
  }, [sortBy, filterYear, filterRating]);

  const { data: discoverResults, loading: discoverLoading } = useDiscover(activeGenres, discoverFilters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleGenre = (id: string) => {
    setActiveGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const chips = genres.map((g) => ({ id: String(g.id), label: g.name }));

  
  const rawMovies = debouncedQuery ? searchResults : discoverResults;
  const displayedMovies = useMemo(() => {
    if (!debouncedQuery) return rawMovies;
    return fuzzyFilter(rawMovies, debouncedQuery, (m) => m.title + ' ' + m.original_title);
  }, [rawMovies, debouncedQuery]);

  const loading = debouncedQuery ? searchLoading : discoverLoading;
  const isEmpty = !loading && displayedMovies.length === 0 && (debouncedQuery || activeGenres.length > 0);

  const hasActiveFilters = filterYear !== null || filterRating !== null || sortBy !== 'popularity.desc';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {}
      <View style={styles.searchRow}>
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
          />
        </View>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters ? theme.accent : theme.surface,
              borderColor: hasActiveFilters ? theme.accent : theme.border,
            },
          ]}
        >
          <IconSymbol
            name="slider.horizontal.3"
            size={20}
            color={hasActiveFilters ? '#FFFFFF' : theme.icon}
          />
        </Pressable>
      </View>

      {}
      <View style={styles.chipsArea}>
        <FilterChips chips={chips} activeIds={activeGenres} onToggle={toggleGenre} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <IconSymbol name="magnifyingglass" size={48} color={theme.textMuted} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.md }}>
            {t('search.noResults')}
          </ThemedText>
          <ThemedText type="caption">{t('search.tryAnotherQuery')}</ThemedText>
        </View>
      ) : (
        <MovieGrid movies={displayedMovies} loading={loading} />
      )}

      {}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View
            style={[styles.modalSheet, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHandle} />

            {}
            <ThemedText type="defaultSemiBold" style={styles.filterSectionTitle}>
              {t('search.sortBy')}
            </ThemedText>
            <View style={styles.optionRow}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSortBy(opt.value)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: sortBy === opt.value ? theme.accent : theme.surfaceVariant,
                      borderColor: sortBy === opt.value ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.optionChipText,
                      { color: sortBy === opt.value ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {}
            <ThemedText type="defaultSemiBold" style={styles.filterSectionTitle}>
              {t('search.filterYear')}
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.optionRow, { paddingHorizontal: 0 }]}>
                <Pressable
                  onPress={() => setFilterYear(null)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: filterYear === null ? theme.accent : theme.surfaceVariant,
                      borderColor: filterYear === null ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.optionChipText,
                      { color: filterYear === null ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {t('search.anyYear')}
                  </ThemedText>
                </Pressable>
                {YEAR_OPTIONS.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => setFilterYear(filterYear === y ? null : y)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: filterYear === y ? theme.accent : theme.surfaceVariant,
                        borderColor: filterYear === y ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.optionChipText,
                        { color: filterYear === y ? '#FFF' : theme.textSecondary },
                      ]}
                    >
                      {y}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {}
            <ThemedText type="defaultSemiBold" style={styles.filterSectionTitle}>
              {t('search.filterRating')}
            </ThemedText>
            <View style={styles.optionRow}>
              <Pressable
                onPress={() => setFilterRating(null)}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: filterRating === null ? theme.accent : theme.surfaceVariant,
                    borderColor: filterRating === null ? theme.accent : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.optionChipText,
                    { color: filterRating === null ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  {t('search.anyRating')}
                </ThemedText>
              </Pressable>
              {RATING_OPTIONS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setFilterRating(filterRating === r.value ? null : r.value)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: filterRating === r.value ? theme.accent : theme.surfaceVariant,
                      borderColor: filterRating === r.value ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.optionChipText,
                      { color: filterRating === r.value ? '#FFF' : theme.textSecondary },
                    ]}
                  >
                    {r.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {}
            <Pressable
              onPress={() => {
                setSortBy('popularity.desc');
                setFilterYear(null);
                setFilterRating(null);
                setFilterModalVisible(false);
              }}
              style={[styles.resetButton, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.textMuted }}>{t('search.resetFilters')}</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBarWrap: { flex: 1 },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsArea: { paddingVertical: Spacing.sm },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  filterSectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 13,
  },
  resetButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
});
