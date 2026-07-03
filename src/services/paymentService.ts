import { api } from './api';

export interface PaymentRecord {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  date: string;
  planName: string;
  status: 'PAID' | 'DUE';
  mode: string | null;
}

export const paymentService = {
  getAll: async (): Promise<PaymentRecord[]> => {
    const res = await api.get('/payments');
    return res.data;
  },

  getByMember: async (memberId: number): Promise<PaymentRecord[]> => {
    const res = await api.get(`/payments/member/${memberId}`);
    return res.data;
  },

  getDue: async (): Promise<PaymentRecord[]> => {
    const res = await api.get('/payments/due');
    return res.data;
  },

  record: async (data: any): Promise<PaymentRecord> => {
    const res = await api.post('/payments', data);
    return res.data;
  },

  markAsPaid: async (paymentId: number): Promise<PaymentRecord> => {
    const res = await api.put(`/payments/${paymentId}/mark-paid`);
    return res.data;
  },

  /**
   * Ledger: all payments between two dates (inclusive), newest first.
   * @param from YYYY-MM-DD
   * @param to   YYYY-MM-DD
   */
  getLedger: async (from: string, to: string): Promise<PaymentRecord[]> => {
    const res = await api.get('/payments/ledger', { params: { from, to } });
    return res.data;
  },
};