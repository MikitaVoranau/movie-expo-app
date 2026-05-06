import {
    clearAllUserData,
    getCollections,
    getListItems
} from '@/db/database';
import { auth } from '@/services/firebase';
import { subscribeToAllUserData } from '@/services/firebase-realtime';
import {
    loadProfileRemote,
    saveCollectionRemote,
    saveListItemRemote,
    saveProfileRemote,
    type RemoteProfile
} from '@/services/firestore-sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    type User
} from 'firebase/auth';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react';

const USERNAME_KEY = 'user_profile_username';
const AVATAR_KEY = 'user_profile_avatar';
const LAST_USER_ID_KEY = 'last_user_id';

export interface UserProfile {
  username: string;
  avatarUri: string | null;
}

interface AuthContextType {
  profile: UserProfile;
  firebaseUid: string | null;
  isAnonymous: boolean;
  userEmail: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  syncToCloud: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isSyncing: boolean;
  realtimeEnabled: boolean;
  toggleRealtime: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  profile: { username: 'MovieFan', avatarUri: null },
  firebaseUid: null,
  isAnonymous: true,
  userEmail: null,
  updateProfile: async () => {},
  syncToCloud: async () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signOut: async () => {},
  isSyncing: false,
  realtimeEnabled: false,
  toggleRealtime: () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>({ username: 'MovieFan', avatarUri: null });
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const syncedRef = useRef(false);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Загрузка профиля из AsyncStorage
  useEffect(() => {
    (async () => {
      const username = await AsyncStorage.getItem(USERNAME_KEY);
      const avatarUri = await AsyncStorage.getItem(AVATAR_KEY);
      setProfile({
        username: username ?? 'MovieFan',
        avatarUri: avatarUri ?? null,
      });
    })();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setFirebaseUid(user.uid);
        setIsAnonymous(user.isAnonymous);
        setUserEmail(user.email);
        
        // Проверяем сменился ли пользователь
        const lastUserId = await AsyncStorage.getItem(LAST_USER_ID_KEY);
        if (lastUserId && lastUserId !== user.uid) {
          console.log('User changed, clearing local data');
          
          // Очищаем локальную базу данных
          try {
            await clearAllUserData();
          } catch (error) {
            console.warn('Could not clear database:', error);
          }
          
          // Очищаем локальный профиль (AsyncStorage)
          await AsyncStorage.removeItem(USERNAME_KEY);
          await AsyncStorage.removeItem(AVATAR_KEY);
          
          // Сбрасываем профиль на дефолтный
          setProfile({ username: 'MovieFan', avatarUri: null });
          
          // Сбрасываем флаг синхронизации
          syncedRef.current = false;
        }
        
        // Сохраняем текущего пользователя
        await AsyncStorage.setItem(LAST_USER_ID_KEY, user.uid);
        
        // Загружаем профиль из Firestore для этого пользователя
        if (!syncedRef.current) {
          syncedRef.current = true;
          await pullRemoteProfile(user.uid);
        }

        // Включаем realtime updates если они были включены
        if (realtimeEnabled) {
          setupRealtimeUpdates(user.uid);
        }
      } else {
        // Анонимный вход если пользователь не залогинен
        signInAnonymously(auth).catch(() => {});
      }
    });
    return unsub;
  }, [realtimeEnabled]);

  const pullRemoteProfile = async (uid: string) => {
    try {
      const remote = await loadProfileRemote(uid);
      if (remote) {
        // Если профиль найден в Firestore, загружаем его
        const username = remote.username || 'MovieFan';
        const avatarUrl = remote.avatarUrl || null;
        
        await AsyncStorage.setItem(USERNAME_KEY, username);
        if (avatarUrl) {
          await AsyncStorage.setItem(AVATAR_KEY, avatarUrl);
        } else {
          await AsyncStorage.removeItem(AVATAR_KEY);
        }
        
        setProfile({ username, avatarUri: avatarUrl });
        console.log('✓ Profile loaded from Firestore:', username);
      } else {
        // Если профиля нет в Firestore, создаём дефолтный
        const defaultUsername = 'MovieFan';
        await AsyncStorage.setItem(USERNAME_KEY, defaultUsername);
        await AsyncStorage.removeItem(AVATAR_KEY);
        setProfile({ username: defaultUsername, avatarUri: null });
        console.log('✓ Default profile created for new user');
      }
    } catch (error) {
      console.warn('Could not load profile from Firestore:', error);
      // В случае ошибки используем дефолтный профиль
      const defaultUsername = 'MovieFan';
      await AsyncStorage.setItem(USERNAME_KEY, defaultUsername);
      await AsyncStorage.removeItem(AVATAR_KEY);
      setProfile({ username: defaultUsername, avatarUri: null });
    }
  };

  const setupRealtimeUpdates = (uid: string) => {
    // Отписываемся от предыдущих подписок
    if (realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current();
    }

    // Подписываемся на все данные пользователя
    realtimeUnsubscribeRef.current = subscribeToAllUserData(uid, {
      onProfileUpdate: async (remoteProfile) => {
        if (remoteProfile) {
          if (remoteProfile.username) {
            await AsyncStorage.setItem(USERNAME_KEY, remoteProfile.username);
            setProfile((prev) => ({ ...prev, username: remoteProfile.username }));
          }
          if (remoteProfile.avatarUrl) {
            await AsyncStorage.setItem(AVATAR_KEY, remoteProfile.avatarUrl);
            setProfile((prev) => ({ ...prev, avatarUri: remoteProfile.avatarUrl }));
          }
        }
      },
      // Можно добавить обработчики для списков и коллекций
    });
  };

  const toggleRealtime = useCallback((enabled: boolean) => {
    setRealtimeEnabled(enabled);
    
    if (enabled && firebaseUid) {
      setupRealtimeUpdates(firebaseUid);
    } else if (!enabled && realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current();
      realtimeUnsubscribeRef.current = null;
    }
  }, [firebaseUid]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const next = { ...profile, ...updates };
      setProfile(next);
      if (updates.username !== undefined) {
        await AsyncStorage.setItem(USERNAME_KEY, updates.username);
      }
      if (updates.avatarUri !== undefined) {
        await AsyncStorage.setItem(AVATAR_KEY, updates.avatarUri ?? '');
      }
      
      // Сохраняем в Firestore
      if (firebaseUid) {
        const remoteProfile: RemoteProfile = {
          username: next.username,
          avatarUrl: next.avatarUri,
          updatedAt: Date.now(),
        };
        saveProfileRemote(firebaseUid, remoteProfile).catch(() => {});
      }
    },
    [profile, firebaseUid]
  );

  // Синхронизация с облаком
  const syncToCloud = useCallback(async () => {
    if (!firebaseUid) return;
    setIsSyncing(true);
    try {
      // Сохраняем профиль
      const remoteProfile: RemoteProfile = {
        username: profile.username,
        avatarUrl: profile.avatarUri,
        updatedAt: Date.now(),
      };
      await saveProfileRemote(firebaseUid, remoteProfile);

      // Сохраняем списки
      const listTypes = ['watchlist', 'favorites', 'watched', 'liked'];
      for (const lt of listTypes) {
        const items = await getListItems(lt);
        for (const item of items) {
          await saveListItemRemote(firebaseUid, item);
        }
      }

      // Сохраняем коллекции
      const cols = await getCollections();
      for (const col of cols) {
        await saveCollectionRemote(firebaseUid, col);
        const colItems = await getListItems(`collection:${col.id}`);
        for (const item of colItems) {
          await saveListItemRemote(firebaseUid, item);
        }
      }
    } catch {
      // Игнорируем ошибки
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUid, profile]);

  // Email/Password Sign In
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      // Сначала входим
      await signInWithEmailAndPassword(auth, email, password);
      
      // Очищаем локальную базу данных
      try {
        await clearAllUserData();
      } catch (dbError) {
        console.warn('Could not clear local database:', dbError);
      }
      
      // Очищаем локальный профиль
      await AsyncStorage.removeItem(USERNAME_KEY);
      await AsyncStorage.removeItem(AVATAR_KEY);
      setProfile({ username: 'MovieFan', avatarUri: null });
      
      // Сбрасываем флаг синхронизации, чтобы профиль загрузился заново
      syncedRef.current = false;
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      };
    }
  }, []);

  // Email/Password Sign Up
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      // Сначала регистрируемся
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Очищаем локальную базу данных
      try {
        await clearAllUserData();
      } catch (dbError) {
        console.warn('Could not clear local database:', dbError);
      }
      
      // Очищаем локальный профиль
      await AsyncStorage.removeItem(USERNAME_KEY);
      await AsyncStorage.removeItem(AVATAR_KEY);
      setProfile({ username: 'MovieFan', avatarUri: null });
      
      // Сбрасываем флаг синхронизации, чтобы профиль загрузился заново
      syncedRef.current = false;
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to sign up' 
      };
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      // Отписываемся от realtime updates
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = null;
      }
      
      // Выходим из Firebase
      await firebaseSignOut(auth);
      syncedRef.current = false;
      
      // Удаляем сохранённый user_id
      await AsyncStorage.removeItem(LAST_USER_ID_KEY);
      
      // Очищаем локальную базу данных
      try {
        await clearAllUserData();
      } catch (dbError) {
        console.warn('Could not clear local database:', dbError);
      }
      
      // Очищаем локальный профиль
      await AsyncStorage.removeItem(USERNAME_KEY);
      await AsyncStorage.removeItem(AVATAR_KEY);
      setProfile({ username: 'MovieFan', avatarUri: null });
      
      console.log('✓ Signed out and cleared all local data');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      profile, 
      firebaseUid, 
      isAnonymous,
      userEmail,
      updateProfile, 
      syncToCloud, 
      signInWithEmail,
      signUpWithEmail,
      signOut,
      isSyncing,
      realtimeEnabled,
      toggleRealtime,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(AuthContext);
}
