import { MemberStatus } from '../types/Members';
import { Colors } from '../constants/theme';

export function getDaysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function resolveStatus(endDate: string, isPaused = false): MemberStatus {
  if (isPaused) return 'paused';
  const days = getDaysRemaining(endDate);
  if (days < 0) return 'expired';
  if (days <= 7) return 'expiring';
  return 'active';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function getPlanProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const progress = (now - start) / (end - start);
  return Math.min(Math.max(progress, 0), 1);
}

export function getStatusColors(status: MemberStatus) {
  switch (status) {
    case 'active':
      return { bg: Colors.activeBg, text: Colors.activeText, dot: Colors.activeGreen };
    case 'expiring':
      return { bg: Colors.expiringBg, text: Colors.expiringText, dot: Colors.expiringAmber };
    case 'expired':
      return { bg: Colors.expiredBg, text: Colors.expiredText, dot: Colors.expiredRed };
    case 'paused':
      return { bg: Colors.pausedBg, text: Colors.pausedText, dot: Colors.pausedGray };
  }
}

export function getStatusLabel(status: MemberStatus): string {
  switch (status) {
    case 'active':   return 'Active';
    case 'expiring': return 'Expiring';
    case 'expired':  return 'Expired';
    case 'paused':   return 'Paused';
  }
}

// Avatar background colors cycling through brand tints
const AVATAR_COLORS = [
  { bg: '#EDE0F5', text: '#982598' },
  { bg: '#E0E1F5', text: '#15173D' },
  { bg: '#F5E0F0', text: '#7A1580' },
  { bg: '#E0EDF5', text: '#155D7D' },
  { bg: '#F0E0F5', text: '#6B1598' },
  { bg: '#E5E0F5', text: '#2D1598' },
];

export function getAvatarColor(id: string) {
  const index = parseInt(id, 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? AVATAR_COLORS[0];
}