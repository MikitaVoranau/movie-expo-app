import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useUserProfile } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = Colors[colorScheme];
  const { signInWithEmail, signUpWithEmail } = useUserProfile();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signin' 
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

      if (result.success) {
        // Навигация произойдёт автоматически через useEffect в _layout.tsx
      } else {
        Alert.alert(t('common.error'), result.error || t('auth.authFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ 
        paddingTop: insets.top + Spacing.xl * 2, 
        paddingBottom: Spacing.xl,
        flexGrow: 1,
        justifyContent: 'center',
      }}
    >
      {/* Logo/Header */}
      <View style={styles.logoContainer}>
        <ThemedText type="title" style={styles.appTitle}>
          🎬 Movie Vault
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textMuted, textAlign: 'center', marginTop: Spacing.sm }}>
          {t('auth.description')}
        </ThemedText>
      </View>

      {/* Auth Form */}
      <View style={[styles.form, { backgroundColor: theme.surface }]}>
        <ThemedText type="subtitle" style={styles.formTitle}>
          {mode === 'signin' ? t('auth.welcome') : t('auth.createAccount')}
        </ThemedText>

        <ThemedText type="defaultSemiBold" style={styles.label}>
          {t('auth.email')}
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.border,
            },
          ]}
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          {t('auth.password')}
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.border,
            },
          ]}
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          onPress={handleSubmit}
          style={[styles.submitButton, { backgroundColor: theme.accent }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText type="defaultSemiBold" style={{ color: '#FFF' }}>
              {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={styles.switchButton}
        >
          <ThemedText type="caption" style={{ color: theme.textMuted }}>
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.accent }}>
            {mode === 'signin' ? t('auth.signUpLink') : t('auth.signInLink')}
          </ThemedText>
        </Pressable>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <ThemedText type="caption" style={{ color: theme.textMuted, textAlign: 'center', lineHeight: 20 }}>
          {t('auth.syncDescription')}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  appTitle: {
    fontSize: 32,
    textAlign: 'center',
  },
  form: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  formTitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  label: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  switchButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  infoSection: {
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});
