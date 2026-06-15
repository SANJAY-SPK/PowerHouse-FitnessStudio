// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from 'react';
// import * as SecureStore from 'expo-secure-store';
// import { api } from '../services/api';

// // ─── Types ───────────────────────────────────────────────────────────────────

// interface User {
//   email: string;
//   role: 'ADMIN' | 'USER';
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   isLoggedIn: boolean;
//   isLoading: boolean;       // true while restoring session on app start
//   isAuthLoading: boolean;   // true while login API call is in progress
//   error: string | null;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
//   clearError: () => void;
// }

// // ─── Context ─────────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // ─── Secure Store Keys ───────────────────────────────────────────────────────

// const TOKEN_KEY = 'auth_token';
// const ROLE_KEY  = 'auth_role';
// const EMAIL_KEY = 'auth_email';

// // ─── Provider ────────────────────────────────────────────────────────────────

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser]               = useState<User | null>(null);
//   const [token, setToken]             = useState<string | null>(null);
//   const [isLoading, setIsLoading]     = useState(true);   // session restore
//   const [isAuthLoading, setIsAuthLoading] = useState(false); // login call
//   const [error, setError]             = useState<string | null>(null);

//   // ── Restore session on app start ──────────────────────────────────────────
//   useEffect(() => {
//     const restoreSession = async () => {
//       try {
//         const [storedToken, storedRole, storedEmail] = await Promise.all([
//           SecureStore.getItemAsync(TOKEN_KEY),
//           SecureStore.getItemAsync(ROLE_KEY),
//           SecureStore.getItemAsync(EMAIL_KEY),
//         ]);

//         if (storedToken && storedRole && storedEmail) {
//           setToken(storedToken);
//           setUser({
//             email: storedEmail,
//             role: storedRole as 'ADMIN' | 'USER',
//           });
//           // Attach token to all future axios requests
//           api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
//         }
//       } catch {
//         // Secure store read failed — treat as logged out
//         await clearStorage();
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     restoreSession();
//   }, []);

//   // ── Login ─────────────────────────────────────────────────────────────────
//   const login = async (email: string, password: string) => {
//     setIsAuthLoading(true);
//     setError(null);

//     try {
//       const res = await api.post('/auth/login', { email, password });
//       const { token: newToken, role, email: userEmail } = res.data;

//       // Persist to secure storage
//       await Promise.all([
//         SecureStore.setItemAsync(TOKEN_KEY, newToken),
//         SecureStore.setItemAsync(ROLE_KEY, role),
//         SecureStore.setItemAsync(EMAIL_KEY, userEmail),
//       ]);

//       // Set axios default header
//       api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

//       setToken(newToken);
//       setUser({ email: userEmail, role });
//     } catch (err: any) {
//       const message =
//         err.response?.data?.message ||
//         err.response?.data ||
//         'Invalid email or password. Please try again.';
//       setError(typeof message === 'string' ? message : 'Login failed.');
//       throw err; // re-throw so login screen can react if needed
//     } finally {
//       setIsAuthLoading(false);
//     }
//   };

//   // ── Logout ────────────────────────────────────────────────────────────────
//   const logout = async () => {
//     await clearStorage();
//     delete api.defaults.headers.common['Authorization'];
//     setToken(null);
//     setUser(null);
//     setError(null);
//   };

//   // ── Helpers ───────────────────────────────────────────────────────────────
//   const clearStorage = async () => {
//     await Promise.all([
//       SecureStore.deleteItemAsync(TOKEN_KEY),
//       SecureStore.deleteItemAsync(ROLE_KEY),
//       SecureStore.deleteItemAsync(EMAIL_KEY),
//     ]);
//   };

//   const clearError = () => setError(null);

//   // ─────────────────────────────────────────────────────────────────────────

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         isLoggedIn: !!user,
//         isLoading,
//         isAuthLoading,
//         error,
//         login,
//         logout,
//         clearError,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ─── Hook ─────────────────────────────────────────────────────────────────────

// export function useAuth(): AuthContextType {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error('useAuth must be used inside <AuthProvider>');
//   }
//   return ctx;
// }