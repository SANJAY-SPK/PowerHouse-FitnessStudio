import { api } from './api';
import { Member } from '../types/Members';

export const memberService = {
  getAll: async (status?: string): Promise<Member[]> => {
    const params = status ? { status } : {};
    const res = await api.get('/members', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Member> => {
    const res = await api.get(`/members/${id}`);
    return res.data;
  },

  create: async (data: any): Promise<Member> => {
    const res = await api.post('/members', data);
    return res.data;
  },

  update: async (id: number, data: any): Promise<Member> => {
    const res = await api.put(`/members/${id}`, data);
    return res.data;
  },

  renew: async (id: number, data: any): Promise<Member> => {
    const res = await api.put(`/members/${id}/renew`, data);
    return res.data;
  },

  checkIn: async (id: number): Promise<Member> => {
    const res = await api.post(`/members/${id}/checkin`);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/members/${id}`);
  },

  patchStatus: async (id: number, status: 'ACTIVE' | 'PAUSED' | 'EXPIRED'): Promise<Member> => {
    const res = await api.patch(`/members/${id}/status`, { status });
    return res.data;
  },
};