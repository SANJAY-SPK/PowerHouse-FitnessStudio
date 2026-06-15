import { create } from 'zustand';
import { router } from 'expo-router';
import { api, setUnauthorizedHandler } from '../services/api';
import { clearStoredAuth, readStoredAuth, saveStoredAuth } from '../services/authStorage';

interface AuthState {
  token: string | null;
  role: string | null;
  email: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  hasRestored: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const clearAuthState = () => {
  delete api.defaults.headers.common.Authorization;
  useAuthStore.setState({
    token: null,
    role: null,
    email: null,
    isLoggedIn: false,
    isLoading: false,
    hasRestored: true,
  });
};

const normalizeRole = (role: string | null | undefined) =>
  role ? role.replace(/^ROLE_/i, '').toUpperCase() : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  email: null,
  isLoggedIn: false,
  isLoading: false,
  hasRestored: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, role, email: userEmail } = res.data;
      const normalizedRole = normalizeRole(role);

      if (!normalizedRole) {
        throw new Error('Login response did not include a role.');
      }

      await saveStoredAuth(token, normalizedRole, userEmail ?? null);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      set({
        token,
        role: normalizedRole,
        email: userEmail ?? null,
        isLoggedIn: true,
        isLoading: false,
        hasRestored: true,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Invalid email or password';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const { token, role, email } = await readStoredAuth();
      const normalizedRole = normalizeRole(role);

      if (token && normalizedRole) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        set({
          token,
          role: normalizedRole,
          email,
          isLoggedIn: true,
          isLoading: false,
          hasRestored: true,
        });
        return;
      }

      clearAuthState();
    } catch {
      await clearStoredAuth();
      clearAuthState();
    }
  },

  logout: async () => {
    await clearStoredAuth();
    clearAuthState();
  },
}));

setUnauthorizedHandler(async () => {
  await clearStoredAuth();
  clearAuthState();
  router.replace('/login');
});
