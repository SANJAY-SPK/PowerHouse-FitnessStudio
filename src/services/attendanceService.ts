import { api } from './api';

export type AttendanceSlot = 'MORNING' | 'EVENING' | 'OTHER';

export interface AttendanceRecord {
  id: number;
  memberId: number;
  memberName: string;
  memberPhone: string;
  isPtMember: boolean;
  date: string;
  visited: boolean;
  checkInTime: string | null;
  slot: AttendanceSlot;
}

export const attendanceService = {
  /**
   * Fetch all attendance records for a given date.
   * @param date YYYY-MM-DD
   * @param slot optional: MORNING | EVENING | OTHER
   */
  getByDate: async (date: string, slot?: AttendanceSlot): Promise<AttendanceRecord[]> => {
    const params: Record<string, string> = { date };
    if (slot) params.slot = slot;
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  /**
   * Check in a member for today (slot auto-detected server-side).
   */
  checkIn: async (memberId: number): Promise<AttendanceRecord> => {
    const res = await api.post(`/attendance/${memberId}/checkin`);
    return res.data;
  },
};
