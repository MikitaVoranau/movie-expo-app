import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GenreStat {
  genre: string;
  percentage: number;
  color: string;
}

interface GenreStatsProps {
  stats: GenreStat[];
}

const GENRE_COLORS = ['#E50914', '#FFD700', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#795548'];

export function GenreStats({ stats }: GenreStatsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  if (stats.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {stats.slice(0, 6).map((stat, index) => (
        <View key={stat.genre} style={styles.row}>
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }]} />
            <ThemedText style={styles.label}>{stat.genre}</ThemedText>
            <ThemedText type="caption">{stat.percentage}%</ThemedText>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme.surfaceVariant }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${stat.percentage}%`,
                  backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    flex: 1,
    fontSize: 13,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
