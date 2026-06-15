import { create } from 'zustand';
import { api } from '../services/api';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiringThisWeek: number;
  expiredMembers: number;
  overduePayments: number;
  totalCollected: number;
  totalPending: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/dashboard/stats');
      set({ stats: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));