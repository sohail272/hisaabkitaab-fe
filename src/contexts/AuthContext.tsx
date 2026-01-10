import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Organization {
  id: number;
  name: string;
  logo_url: string | null;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  organization_id: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'store_worker' | 'store_manager' | 'org_admin';
  organization: Organization;
  store: Store | null;
}

interface AuthContextType {
  user: User | null;
  currentStore: Store | null;
  token: string | null;
  availableStores: Store[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentStore: (store: Store | null) => void;
  fetchAvailableStores: () => Promise<void>;
  isAuthenticated: boolean;
  isOrgAdmin: boolean;
  isStoreManager: boolean;
  isStoreWorker: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedStore = localStorage.getItem('current_store');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      if (storedStore) {
        setCurrentStore(JSON.parse(storedStore));
      } else if (JSON.parse(storedUser).store) {
        setCurrentStore(JSON.parse(storedUser).store);
      }
    }
  }, []);

  // Fetch available stores when user changes
  useEffect(() => {
    if (user && token) {
      fetchAvailableStores();
    }
  }, [user, token]);

  const fetchAvailableStores = async () => {
    if (!token) return;

    try {
      const envBase = import.meta.env.VITE_API_BASE_URL;
      const BASE = (envBase && typeof envBase === 'string' && envBase.trim() !== '' && (envBase.startsWith('http://') || envBase.startsWith('https://')))
        ? envBase.replace(/\/$/, '')
        : 'https://hisaabkitaab-be.onrender.com/api/v1';
      
      const response = await fetch(`${BASE}/stores/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stores = await response.json();
        setAvailableStores(stores);
        
        // Set current store if not set and user has a store
        if (!currentStore && stores.length > 0) {
          if (user?.store) {
            const userStore = stores.find((s: Store) => s.id === user.store?.id);
            if (userStore) {
              setCurrentStore(userStore);
              localStorage.setItem('current_store', JSON.stringify(userStore));
            }
          } else if (stores.length === 1) {
            // Org admin with only one store
            setCurrentStore(stores[0]);
            localStorage.setItem('current_store', JSON.stringify(stores[0]));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch available stores:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const envBase = import.meta.env.VITE_API_BASE_URL;
    const BASE = (envBase && typeof envBase === 'string' && envBase.trim() !== '' && (envBase.startsWith('http://') || envBase.startsWith('https://')))
      ? envBase.replace(/\/$/, '')
      : 'https://hisaabkitaab-be.onrender.com/api/v1';
    
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    const { token: newToken, user: newUser } = data;

    setToken(newToken);
    setUser(newUser);
    setCurrentStore(newUser.store || null);

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    if (newUser.store) {
      localStorage.setItem('current_store', JSON.stringify(newUser.store));
    }

    // Fetch available stores after login
    await fetchAvailableStores();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCurrentStore(null);
    setAvailableStores([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('current_store');
  };

  const handleSetCurrentStore = (store: Store | null) => {
    setCurrentStore(store);
    if (store) {
      localStorage.setItem('current_store', JSON.stringify(store));
    } else {
      localStorage.removeItem('current_store');
    }
    // Trigger a custom event so pages can listen and refetch data
    window.dispatchEvent(new CustomEvent('storeChanged', { detail: store }));
  };

  const isAuthenticated = !!user && !!token;
  const isOrgAdmin = user?.role === 'org_admin';
  const isStoreManager = user?.role === 'store_manager';
  const isStoreWorker = user?.role === 'store_worker';

  return (
    <AuthContext.Provider
      value={{
        user,
        currentStore,
        token,
        availableStores,
        login,
        logout,
        setCurrentStore: handleSetCurrentStore,
        fetchAvailableStores,
        isAuthenticated,
        isOrgAdmin,
        isStoreManager,
        isStoreWorker,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

