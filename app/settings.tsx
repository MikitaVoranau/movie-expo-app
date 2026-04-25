import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { ThemeContext, type ThemeMode } from '@/context/theme-context';
import { clearWatchedHistory } from '@/db/database';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { themeMode, setThemeMode } = useContext(ThemeContext);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.system') },
    { value: 'dark', label: t('settings.dark') },
    { value: 'light', label: t('settings.light') },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
  ];

  const handleClearHistory = () => {
    Alert.alert(
      t('profile.clearHistory'),
      t('profile.clearHistoryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.clear'), 
          style: 'destructive', 
          onPress: async () => {
            await clearWatchedHistory();
          }
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.xl }}
    >
      <ThemedText type="title" style={styles.screenTitle}>{t('settings.title')}</ThemedText>

      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.theme')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        {themeOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setThemeMode(opt.value)}
            style={[styles.optionRow, { borderBottomColor: theme.border }]}
          >
            <ThemedText>{opt.label}</ThemedText>
            {themeMode === opt.value && (
              <IconSymbol name="checkmark" size={20} color={theme.accent} />
            )}
          </Pressable>
        ))}
      </View>

      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.language')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        {languageOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => i18n.changeLanguage(opt.value)}
            style={[styles.optionRow, { borderBottomColor: theme.border }]}
          >
            <ThemedText>{opt.label}</ThemedText>
            {i18n.language === opt.value && (
              <IconSymbol name="checkmark" size={20} color={theme.accent} />
            )}
          </Pressable>
        ))}
      </View>

      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('profile.clearHistory')}
      </ThemedText>
      <Pressable
        onPress={handleClearHistory}
        style={[styles.optionGroup, { backgroundColor: theme.surface }]}
      >
        <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
          <ThemedText style={{ color: theme.accent }}>{t('profile.clearHistory')}</ThemedText>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionGroup: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
});
