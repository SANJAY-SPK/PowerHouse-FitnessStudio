export type MemberStatus = 'active' | 'expiring' | 'expired' | 'paused';
export type PlanType = 'monthly' | 'quarterly' | 'annual';
export type PaymentMode = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'paid' | 'due';

export interface Payment {
  id: string;
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
  id: string;
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
  notes?: string;
}