import { create } from 'zustand';
import { memberService } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';

interface AlertCountState {
  unreadCount: number;
  isFetching: boolean;
  fetchUnreadCount: () => Promise<void>;
}

export const useAlertStore = create<AlertCountState>((set) => ({
  unreadCount: 0,
  isFetching: false,

  fetchUnreadCount: async () => {
    set({ isFetching: true });
    try {
      const [members, duePayments] = await Promise.all([
        memberService.getAll() as Promise<any[]>,
        paymentService.getDue() as Promise<any[]>,
      ]);

      const now = new Date();
      let count = 0;

      for (const m of members) {
        // Expiring soon or already expired
        if (m.status === 'EXPIRING' || m.status === 'EXPIRED') count++;
        // Inactive 14+ days
        if (m.lastCheckIn) {
          const diffDays = Math.floor(
            (now.getTime() - new Date(m.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays >= 14) count++;
        }
      }

      // Due payments
      count += duePayments.length;

      set({ unreadCount: count, isFetching: false });
    } catch {
      set({ isFetching: false });
    }
  },
}));