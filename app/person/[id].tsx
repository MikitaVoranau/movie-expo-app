import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MovieCard } from '@/components/movie-card';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePersonDetail } from '@/hooks/use-tmdb';
import { profileUrl } from '@/services/tmdb';

const PHOTO_SIZE = 120;

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];

  const { person, movies, loading } = usePersonDetail(Number(id));

  if (loading || !person) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + Spacing.sm }]}
      >
        <IconSymbol name="arrow.left" size={22} color={theme.text} />
      </Pressable>

      {}
      <View style={[styles.header, { paddingTop: insets.top + 56 }]}>
        <Image
          source={{ uri: profileUrl(person.profile_path, 'w300') }}
          style={styles.photo}
          contentFit="cover"
        />
        <ThemedText type="heading" style={styles.name}>{person.name}</ThemedText>
        <ThemedText type="caption">{person.known_for_department}</ThemedText>

        {person.birthday && (
          <ThemedText type="caption" style={styles.meta}>
            {t('person.bornOn', { date: person.birthday })}
          </ThemedText>
        )}
        {person.place_of_birth && (
          <ThemedText type="caption" style={styles.meta}>
            {t('person.birthPlace', { place: person.place_of_birth })}
          </ThemedText>
        )}
      </View>

      {}
      {person.biography ? (
        <>
          <SectionHeader title={t('person.biography')} />
          <ThemedText style={styles.biography}>{person.biography}</ThemedText>
        </>
      ) : null}

      {}
      {movies.length > 0 && (
        <>
          <SectionHeader title={t('person.filmography')} />
          <FlatList
            horizontal
            data={movies.slice(0, 20)}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MovieCard movie={item} />}
            contentContainerStyle={{ paddingHorizontal: Spacing.md }}
            showsHorizontalScrollIndicator={false}
          />
        </>
      )}

      <View style={{ height: Spacing.xl * 2 }} />
    </ScrollView>
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
  backButton: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: '#2A2A2A',
    marginBottom: Spacing.md,
  },
  name: {
    textAlign: 'center',
  },
  meta: {
    marginTop: 4,
  },
  biography: {
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
});
