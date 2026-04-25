import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isChecking: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isChecking: false,
});

async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.themoviedb.org/3/configuration', {
      method: 'HEAD',
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

export function NetworkProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const appState = useRef(AppState.currentState);

  const check = async () => {
    const result = await checkConnection();
    setIsConnected(result);
    setIsChecking(false);
  };

  useEffect(() => {
    check();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        check();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
