export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'EXPIRING' | 'PAUSED';
export type PlanType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'paid' | 'due';

export interface Payment {
  id: number;
  amount: number;
  date: string;
  planName: string;
  status: PaymentStatus;
  mode?: PaymentMode;
}

export interface AttendanceDay {
  date: string;
  visited: boolean;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  joinDate: string;
  assignedTrainer?: string;
  planId: string;
  planName: string;
  planType: PlanType;
  planStartDate: string;
  planEndDate: string;
  status: MemberStatus;
  lastCheckIn?: string;
  totalVisitsThisMonth: number;
  attendance: AttendanceDay[];
  payments: Payment[];
  daysRemaining: number;
  notes?: string;
}