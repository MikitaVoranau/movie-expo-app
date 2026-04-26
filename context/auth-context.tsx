import {
    getCollections,
    getListItems
} from '@/db/database';
import { auth } from '@/services/firebase';
import {
    loadProfileRemote,
    saveCollectionRemote,
    saveListItemRemote,
    saveProfileRemote,
    type RemoteProfile
} from '@/services/firestore-sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
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

export interface UserProfile {
  username: string;
  avatarUri: string | null;
}

interface AuthContextType {
  profile: UserProfile;
  firebaseUid: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  syncToCloud: () => Promise<void>;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType>({
  profile: { username: 'MovieFan', avatarUri: null },
  firebaseUid: null,
  updateProfile: async () => {},
  syncToCloud: async () => {},
  isSyncing: false,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>({ username: 'MovieFan', avatarUri: null });
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncedRef = useRef(false);

  
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

  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setFirebaseUid(user.uid);
        
        if (!syncedRef.current) {
          syncedRef.current = true;
          await pullRemoteProfile(user.uid);
        }
      } else {
        
        signInAnonymously(auth).catch(() => {});
      }
    });
    return unsub;
  }, []);

  const pullRemoteProfile = async (uid: string) => {
    try {
      const remote = await loadProfileRemote(uid);
      if (remote) {
        if (remote.username) {
          await AsyncStorage.setItem(USERNAME_KEY, remote.username);
          setProfile((prev) => ({ ...prev, username: remote.username }));
        }
        if (remote.avatarUrl) {
          await AsyncStorage.setItem(AVATAR_KEY, remote.avatarUrl);
          setProfile((prev) => ({ ...prev, avatarUri: remote.avatarUrl }));
        }
      }
    } catch {
      
    }
  };

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

  
  const syncToCloud = useCallback(async () => {
    if (!firebaseUid) return;
    setIsSyncing(true);
    try {
      
      const remoteProfile: RemoteProfile = {
        username: profile.username,
        avatarUrl: profile.avatarUri,
        updatedAt: Date.now(),
      };
      await saveProfileRemote(firebaseUid, remoteProfile);

      
      const listTypes = ['watchlist', 'favorites', 'watched', 'liked'];
      for (const lt of listTypes) {
        const items = await getListItems(lt);
        for (const item of items) {
          await saveListItemRemote(firebaseUid, item);
        }
      }

      
      const cols = await getCollections();
      for (const col of cols) {
        await saveCollectionRemote(firebaseUid, col);
        const colItems = await getListItems(`collection:${col.id}`);
        for (const item of colItems) {
          await saveListItemRemote(firebaseUid, item);
        }
      }
    } catch {
      
    } finally {
      setIsSyncing(false);
    }
  }, [firebaseUid, profile]);

  return (
    <AuthContext.Provider value={{ profile, firebaseUid, updateProfile, syncToCloud, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(AuthContext);
}
