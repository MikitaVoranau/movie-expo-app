import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { FilterChips } from '@/components/filter-chips';
import { MovieGrid } from '@/components/movie-grid';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSearch, useMovieGenres, useDiscover } from '@/hooks/use-tmdb';

export default function SearchScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState<string[]>([]);

  const { data: genres } = useMovieGenres();
  const { data: searchResults, loading: searchLoading } = useSearch(debouncedQuery);
  const { data: discoverResults, loading: discoverLoading } = useDiscover(activeGenres);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleGenre = (id: string) => {
    setActiveGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const chips = genres.map((g) => ({ id: String(g.id), label: g.name }));
  const displayedMovies = debouncedQuery ? searchResults : discoverResults;
  const loading = debouncedQuery ? searchLoading : discoverLoading;

  const isEmpty = !loading && displayedMovies.length === 0 && (debouncedQuery || activeGenres.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.searchArea}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
        />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipsArea: {
    paddingVertical: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
});
