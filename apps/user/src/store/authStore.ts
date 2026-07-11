import { create } from 'zustand';
import { IPublicUser } from 'gymfuel-shared';

interface AuthState {
  user: IPublicUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  loginWithEmail: (email: string, password: string) => Promise<IPublicUser>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<IPublicUser>;
  loginWithGoogle: (idToken: string) => Promise<IPublicUser>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<IPublicUser | null>;
  clearError: () => void;
}

const API_BASE = '/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error?.message || 'Login failed. Please check your credentials.',
        );
      }

      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Login failed';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  registerWithEmail: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Registration failed.');
      }

      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Google authentication failed.');
      }

      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Google authentication failed';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/user/profile`);
      if (res.status === 401) {
        // Unauthenticated is expected on startup if not logged in
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to fetch user profile.');
      }

      set({
        user: data.user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
      return data.user;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
      return null;
    }
  },
}));
