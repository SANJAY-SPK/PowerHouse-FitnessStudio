export type AlertType = 'expiry' | 'payment' | 'inactive';

export interface Alert {
  id: string;
  memberId: string;
  memberName: string;
  type: AlertType;
  message: string;
  subMessage?: string;
  createdAt: string;
  isRead: boolean;
}