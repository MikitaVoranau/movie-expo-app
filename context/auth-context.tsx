import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  username: string;
  avatarUri: string | null;
}

interface AuthContextType {
  profile: UserProfile;
  setUsername: (name: string) => void;
}

const defaultProfile: UserProfile = {
  username: 'Cinephile',
  avatarUri: null,
};

const STORAGE_KEY = 'user_profile';

const AuthContext = createContext<AuthContextType>({
  profile: defaultProfile,
  setUsername: () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        setProfile(JSON.parse(value));
      }
    });
  }, []);

  const setUsername = (name: string) => {
    const updated = { ...profile, username: name };
    setProfile(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ profile, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(AuthContext);
}
