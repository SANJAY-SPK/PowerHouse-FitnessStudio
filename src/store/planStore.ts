import { create } from 'zustand';
import { Plan } from '../types/Plan';
import { api } from '../services/api';

interface PlanState {
  plans: Plan[];
  isLoading: boolean;
  fetchPlans: () => Promise<void>;
}

export const usePlanStore = create<PlanState>((set) => ({
  plans: [],
  isLoading: false,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/plans');
      set({ plans: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));