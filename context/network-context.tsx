import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

interface NetworkContextType {
  isConnected: boolean;
  isChecking: boolean;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isChecking: false,
  connectionType: null,
});

export function NetworkProvider({ children }: PropsWithChildren) {
  // Временно всегда считаем что интернет есть
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>('wifi');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Игнорируем false, только если действительно нет подключения
      const connected = state.isConnected ?? true;
      console.log('Network state:', state);
      setIsConnected(connected);
      setConnectionType(state.type);
      setIsChecking(false);
    });

    NetInfo.fetch().then(state => {
      const connected = state.isConnected ?? true;
      console.log('Initial network state:', state);
      setIsConnected(connected);
      setConnectionType(state.type);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking, connectionType }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
