import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { profileUrl } from '@/services/tmdb';
import type { TmdbCredits } from '@/services/types';

interface CastListProps {
  credits: TmdbCredits;
}

const AVATAR_SIZE = 60;

export function CastList({ credits }: CastListProps) {
  const router = useRouter();

  return (
    <FlatList
      horizontal
      data={credits.cast.slice(0, 20)}
      keyExtractor={(item) => String(item.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/person/${item.id}`)}
          style={styles.item}
        >
          <Image
            source={{ uri: profileUrl(item.profile_path) }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <ThemedText numberOfLines={1} style={styles.name}>
            {item.name}
          </ThemedText>
          <ThemedText numberOfLines={1} type="caption" style={styles.character}>
            {item.character}
          </ThemedText>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  item: {
    alignItems: 'center',
    width: AVATAR_SIZE + 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#2A2A2A',
  },
  name: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  character: {
    fontSize: 10,
    textAlign: 'center',
  },
});
