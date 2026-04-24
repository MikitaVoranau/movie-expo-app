import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ResolvedScheme;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  colorScheme: 'dark',
  setThemeMode: () => {},
});

const STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setThemeModeState(value);
      }
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const colorScheme: ResolvedScheme =
    themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode;

  if (!isLoaded) return null;
  
  return (
    <ThemeContext.Provider value={{ themeMode, colorScheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
