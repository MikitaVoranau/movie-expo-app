import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ru from './locales/ru.json';

const LANGUAGE_KEY = 'app_language';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) {
      callback(stored);
      return;
    }
    const deviceLang = getLocales()[0]?.languageCode ?? 'en';
    callback(deviceLang === 'ru' ? 'ru' : 'en');
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  },
};

i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
