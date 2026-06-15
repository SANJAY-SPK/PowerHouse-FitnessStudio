import { api } from './api';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface RevenueStats {
  period: 'OVERALL' | 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
  label: string;          // e.g. "All Time", "2026", "June 2026", "Mon 15 – Sun 21 Jun"
  totalCollected: number;
  totalPending: number;
  transactionCount: number;
  chartData: ChartPoint[];
}

export const revenueService = {
  getOverall: async (): Promise<RevenueStats> => {
    const res = await api.get('/revenue/overall');
    return res.data;
  },

  getYearly: async (year: number): Promise<RevenueStats> => {
    const res = await api.get('/revenue/yearly', { params: { year } });
    return res.data;
  },

  getMonthly: async (year: number, month: number): Promise<RevenueStats> => {
    const res = await api.get('/revenue/monthly', { params: { year, month } });
    return res.data;
  },

  getWeekly: async (date: string): Promise<RevenueStats> => {
    // date: 'YYYY-MM-DD'
    const res = await api.get('/revenue/weekly', { params: { date } });
    return res.data;
  },

  getDaily: async (date: string): Promise<RevenueStats> => {
    // date: 'YYYY-MM-DD'
    const res = await api.get('/revenue/daily', { params: { date } });
    return res.data;
  },
};
