import * as SecureStore from 'expo-secure-store';

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_ROLE_KEY = 'auth_role';
export const AUTH_EMAIL_KEY = 'auth_email';

type StoredAuth = {
  token: string | null;
  role: string | null;
  email: string | null;
};

let cachedAuth: StoredAuth = {
  token: null,
  role: null,
  email: null,
};

export const getCachedAuth = () => cachedAuth;

export const readStoredAuth = async () => {
  const [token, role, email] = await Promise.all([
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    SecureStore.getItemAsync(AUTH_ROLE_KEY),
    SecureStore.getItemAsync(AUTH_EMAIL_KEY),
  ]);

  cachedAuth = { token, role, email };
  return cachedAuth;
};

export const saveStoredAuth = async (
  token: string,
  role: string,
  email: string | null,
) => {
  cachedAuth = { token, role, email };

  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
    SecureStore.setItemAsync(AUTH_ROLE_KEY, role),
    email
      ? SecureStore.setItemAsync(AUTH_EMAIL_KEY, email)
      : SecureStore.deleteItemAsync(AUTH_EMAIL_KEY),
  ]);
};

export const clearStoredAuth = async () => {
  cachedAuth = {
    token: null,
    role: null,
    email: null,
  };

  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_ROLE_KEY),
    SecureStore.deleteItemAsync(AUTH_EMAIL_KEY),
  ]);
};
