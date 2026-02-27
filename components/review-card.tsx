import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TmdbReview } from '@/services/types';

interface ReviewCardProps {
  review: TmdbReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [expanded, setExpanded] = useState(false);

  const rating = review.author_details.rating;
  const dateStr = new Date(review.created_at).toLocaleDateString();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">{review.author}</ThemedText>
        {rating != null && (
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={14} color={theme.accentGold} />
            <ThemedText type="badge" style={{ color: theme.accentGold }}>
              {rating.toFixed(0)}
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText
        type="caption"
        numberOfLines={expanded ? undefined : 4}
        style={styles.content}
      >
        {review.content}
      </ThemedText>
      {review.content.length > 200 && (
        <Pressable onPress={() => setExpanded(!expanded)}>
          <ThemedText style={{ color: theme.accent, fontSize: 13 }}>
            {expanded ? t('movie.readLess') : t('movie.readMore')}
          </ThemedText>
        </Pressable>
      )}
      <ThemedText type="caption" style={styles.date}>{dateStr}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  content: {
    lineHeight: 20,
  },
  date: {
    marginTop: Spacing.sm,
  },
});
