import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MovieCard } from '@/components/movie-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePopular, useTopRated, useTrending, useUpcoming } from '@/hooks/use-tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - COLUMN_GAP) / 2;

export default function DiscoveryScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { isConnected } = useNetwork();

  const { data: trending, loading: trendingLoading } = useTrending();
  const { data: popular } = usePopular();
  const { data: topRated } = useTopRated();
  const { data: upcoming } = useUpcoming();

  const allMovies = [...trending, ...popular, ...topRated, ...upcoming];
  const uniqueMovies = allMovies.filter((movie, index, self) => 
    index === self.findIndex((m) => m.id === movie.id)
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.surface }]}>
          <ThemedText type="caption" style={{ color: theme.accentGold }}>
            {t('common.offline')}
          </ThemedText>
        </View>
      )}
      {trendingLoading && (
        <View style={styles.loadingContainer}>
          <ThemedText type="caption">{t('common.loading')}</ThemedText>
        </View>
      )}

      <FlatList
        data={uniqueMovies}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => <MovieCard movie={item} width={CARD_WIDTH} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  offlineBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: Spacing.sm,
  },
});
