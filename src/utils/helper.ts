import { MemberStatus } from '../types/Members';
import { Colors } from '../constants/theme';

export function getStatusColors(status: MemberStatus | string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { bg: Colors.activeBg, text: Colors.activeText, dot: Colors.activeGreen };
    case 'EXPIRING':
      return { bg: Colors.expiringBg, text: Colors.expiringText, dot: Colors.expiringAmber };
    case 'EXPIRED':
      return { bg: Colors.expiredBg, text: Colors.expiredText, dot: Colors.expiredRed };
    case 'PAUSED':
      return { bg: Colors.pausedBg, text: Colors.pausedText, dot: Colors.pausedGray };
    default:
      // Fallback — never crashes even if status is null/undefined
      return { bg: Colors.pausedBg, text: Colors.pausedText, dot: Colors.pausedGray };
  }
}

export function getStatusLabel(status: MemberStatus | string): string {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':   return 'Active';
    case 'EXPIRING': return 'Expiring';
    case 'EXPIRED':  return 'Expired';
    case 'PAUSED':   return 'Paused';
    default:         return status ?? 'Unknown';
  }
}

export function resolveStatus(endDate: string, isPaused = false): MemberStatus {
  if (isPaused) return 'PAUSED' as MemberStatus;
  const days = getDaysRemaining(endDate);
  if (days < 0) return 'EXPIRED' as MemberStatus;
  if (days <= 7) return 'EXPIRING' as MemberStatus;
  return 'ACTIVE' as MemberStatus;
}

export function getDaysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
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

export function getAvatarColor(id: string) {
  const AVATAR_COLORS = [
    { bg: '#EDE0F5', text: '#982598' },
    { bg: '#E0E1F5', text: '#15173D' },
    { bg: '#F5E0F0', text: '#7A1580' },
    { bg: '#E0EDF5', text: '#155D7D' },
    { bg: '#F0E0F5', text: '#6B1598' },
    { bg: '#E5E0F5', text: '#2D1598' },
  ];
  const index = parseInt(id, 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[isNaN(index) ? 0 : index] ?? AVATAR_COLORS[0];
}