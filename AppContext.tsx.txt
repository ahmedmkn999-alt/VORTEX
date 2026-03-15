import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCfLBJz67I7_ig5tLq6AE_poyBrM6N3Ypg",
  authDomain: "vortex-27bef.firebaseapp.com",
  projectId: "vortex-27bef",
  storageBucket: "vortex-27bef.firebasestorage.app",
  messagingSenderId: "980498648862",
  appId: "1:980498648862:web:cd1f6652ea386653ab830f"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

interface AppContextType {
  user: User | null;
  loading: boolean;
  userData: any;
  setUserData: (data: any) => void;
}

const AppContext = createContext<AppContextType>({
  user: null, loading: true, userData: null, setUserData: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ user, loading, userData, setUserData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
export default AppContext;
