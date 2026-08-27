import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  membershipPlan: string;
  membershipExpiry: string;
  avatar: string | null;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const dummyUser: User = {
  id: 'u123',
  name: 'Sachin',
  email: 'sachin@example.com',
  membershipPlan: 'Pro Membership',
  membershipExpiry: 'Oct 25, 2026',
  avatar: null,
};

export const useUserStore = create<UserState>((set) => ({
  user: dummyUser, // Start logged in with dummy user
  isLoggedIn: true,
  login: (email: string) => {
    // Dummy login logic
    set({
      user: {
        ...dummyUser,
        email,
      },
      isLoggedIn: true,
    });
  },
  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
    });
  },
}));
