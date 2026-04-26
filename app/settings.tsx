import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useUserProfile } from '@/context/auth-context';
import { ThemeContext, type ThemeMode } from '@/context/theme-context';
import { clearCache, clearWatchedHistory } from '@/db/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadToImageKit } from '@/services/imagekit-signed';
import {
  DEFAULT_NOTIF_HOUR,
  getNotificationHour,
  getNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '@/services/notifications';
import * as Notifications from 'expo-notifications';

const HOUR_OPTIONS = [8, 10, 12, 14, 16, 18, 19, 20, 21, 22];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { themeMode, setThemeMode } = useContext(ThemeContext);
  const { profile, updateProfile, syncToCloud, isSyncing, firebaseUid } = useUserProfile();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(DEFAULT_NOTIF_HOUR);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifEnabled);
    getNotificationHour().then(setNotifHour);
  }, []);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.system') },
    { value: 'dark', label: t('settings.dark') },
    { value: 'light', label: t('settings.light') },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
  ];

  const handleToggleNotifications = async (value: boolean) => {
    const title = t('notifications.reminderTitle');
    const body = t('notifications.reminderBody');
    const result = await setNotificationsEnabled(value, notifHour, title, body);
    setNotifEnabled(result);
    if (value && !result) {
      Alert.alert(t('notifications.permissionDeniedTitle'), t('notifications.permissionDeniedBody'));
    }
  };

  const handleChangeHour = async (hour: number) => {
    setNotifHour(hour);
    setShowHourPicker(false);
    if (notifEnabled) {
      const title = t('notifications.reminderTitle');
      const body = t('notifications.reminderBody');
      await setNotificationsEnabled(true, hour, title, body);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('settings.permissionDenied'), t('settings.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const asset = result.assets[0];
      const fileName = `avatar_${Date.now()}.jpg`;
      const uploaded = await uploadToImageKit(asset.uri, fileName);
      await updateProfile({ avatarUri: uploaded.url });
    } catch {
      Alert.alert(t('common.error'), t('settings.uploadFailed'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(t('notifications.permissionDeniedTitle'), t('notifications.permissionDeniedBody'));
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.reminderTitle'),
        body: t('notifications.reminderBody'),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    });
    Alert.alert('✓', t('settings.testNotifSent'));
  };

  const handleSaveUsername = async () => {
    const name = usernameInput.trim();
    if (!name) return;
    await updateProfile({ username: name });
    setEditingUsername(false);
  };

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
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearCache();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.xl }}
    >
      <ThemedText type="title" style={styles.screenTitle}>
        {t('settings.title')}
      </ThemedText>

      {}
      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.profile')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={handlePickAvatar}
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
        >
          <ThemedText>{t('settings.changeAvatar')}</ThemedText>
          <View style={styles.avatarPreview}>
            {avatarUploading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : profile.avatarUri ? (
              <ExpoImage
                source={{ uri: profile.avatarUri }}
                style={styles.avatarThumb}
                contentFit="cover"
              />
            ) : (
              <IconSymbol name="person.circle" size={32} color={theme.textMuted} />
            )}
          </View>
        </Pressable>

        <View style={[styles.optionRow, { borderBottomColor: 'transparent' }]}>
          {editingUsername ? (
            <TextInput
              style={[styles.usernameInput, { color: theme.text, borderColor: theme.border }]}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoFocus
              onSubmitEditing={handleSaveUsername}
              returnKeyType="done"
            />
          ) : (
            <ThemedText>{profile.username}</ThemedText>
          )}
          <Pressable
            onPress={
              editingUsername
                ? handleSaveUsername
                : () => {
                    setUsernameInput(profile.username);
                    setEditingUsername(true);
                  }
            }
          >
            <ThemedText style={{ color: theme.accent }}>
              {editingUsername ? t('common.save') : t('settings.edit')}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {}
      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.cloud')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={syncToCloud}
          disabled={isSyncing}
          style={[styles.optionRow, { borderBottomColor: 'transparent' }]}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <ThemedText style={{ color: theme.accent }}>{t('settings.syncNow')}</ThemedText>
          )}
        </Pressable>
      </View>

      {}
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

      {}
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

      {}
      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.notifications')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
          <View style={styles.notifLabelWrap}>
            <ThemedText>{t('settings.weeklyReminder')}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textMuted }}>
              {t('settings.weeklyReminderDesc')}
            </ThemedText>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {notifEnabled && (
          <Pressable
            onPress={() => setShowHourPicker(!showHourPicker)}
            style={[styles.optionRow, { borderBottomColor: theme.border }]}
          >
            <ThemedText>{t('settings.notifTime')}</ThemedText>
            <ThemedText style={{ color: theme.accent }}>
              {String(notifHour).padStart(2, '0')}:00
            </ThemedText>
          </Pressable>
        )}

        {notifEnabled && showHourPicker && (
          <View style={[styles.hourGrid, { borderTopColor: theme.border }]}>
            {HOUR_OPTIONS.map((h) => (
              <Pressable
                key={h}
                onPress={() => handleChangeHour(h)}
                style={[
                  styles.hourChip,
                  {
                    backgroundColor: notifHour === h ? theme.accent : theme.surfaceVariant,
                    borderColor: notifHour === h ? theme.accent : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 13,
                    color: notifHour === h ? '#FFF' : theme.textSecondary,
                  }}
                >
                  {String(h).padStart(2, '0')}:00
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {}
        <Pressable
          onPress={handleTestNotification}
          style={[styles.optionRow, { borderBottomColor: 'transparent' }]}
        >
          <ThemedText style={{ color: theme.accentGold }}>{t('settings.testNotif')}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textMuted }}>5s</ThemedText>
        </Pressable>
      </View>

      {}
      <ThemedText type="sectionTitle" style={styles.sectionLabel}>
        {t('settings.data')}
      </ThemedText>
      <View style={[styles.optionGroup, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={handleClearHistory}
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
        >
          <ThemedText style={{ color: theme.accent }}>{t('profile.clearHistory')}</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleClearCache}
          style={[styles.optionRow, { borderBottomColor: 'transparent' }]}
        >
          <ThemedText style={{ color: theme.accent }}>{t('settings.clearCache')}</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  notifLabelWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 0.5,
  },
  hourChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  avatarPreview: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
});
