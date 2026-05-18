import { create } from 'zustand';
import { setAccessToken } from '../api/client';
import type { User } from '../types/auth';

const SESSION_HINT_KEY = 'fr_has_session';
export const USER_CACHE_KEY = 'fr_cached_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token, user) => {
    setAccessToken(token);
    localStorage.setItem(SESSION_HINT_KEY, '1');
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    setAccessToken(null);
    localStorage.removeItem(SESSION_HINT_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
