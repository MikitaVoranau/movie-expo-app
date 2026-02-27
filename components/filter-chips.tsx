import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FilterChip {
  id: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeIds: string[];
  onToggle: (id: string) => void;
}

export function FilterChips({ chips, activeIds, onToggle }: FilterChipsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <FlatList
      horizontal
      data={chips}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const active = activeIds.includes(item.id);
        return (
          <Pressable
            onPress={() => onToggle(item.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.accent : 'transparent',
                borderColor: active ? theme.accent : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.label,
                { color: active ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {item.label}
            </ThemedText>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
  },
});
