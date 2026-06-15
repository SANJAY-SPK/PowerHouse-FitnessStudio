import { api } from './api';

export interface Plan {
  id: number;
  name: string;
  type: string;        // 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'LIFETIME'
  durationDays: number;
  price: number;
  features: string;   // backend stores as a plain string
  active: boolean;
}

export interface PlanPayload {
  name: string;
  type: string;
  durationDays: number;
  price: number;
  features: string;
}

export const planService = {
  getAll: async (): Promise<Plan[]> => {
    const res = await api.get('/plans');
    return res.data;
  },

  getById: async (id: number): Promise<Plan> => {
    const res = await api.get(`/plans/${id}`);
    return res.data;
  },

  create: async (data: PlanPayload): Promise<Plan> => {
    const res = await api.post('/plans', data);
    return res.data;
  },

  update: async (id: number, data: PlanPayload): Promise<Plan> => {
    const res = await api.put(`/plans/${id}`, data);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },
};
