import { api } from './api';

export const paymentService = {
  getAll: async () => {
    const res = await api.get('/payments');
    return res.data;
  },

  getByMember: async (memberId: number) => {
    const res = await api.get(`/payments/member/${memberId}`);
    return res.data;
  },

  getDue: async () => {
    const res = await api.get('/payments/due');
    return res.data;
  },

  record: async (data: any) => {
    const res = await api.post('/payments', data);
    return res.data;
  },

  markAsPaid: async (paymentId: number) => {
    const res = await api.put(`/payments/${paymentId}/mark-paid`);
    return res.data;
  },
};