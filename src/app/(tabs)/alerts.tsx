import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert as RNAlert } from 'react-native';
import { Alert, AlertType } from '@/types/Alert';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import AlertCard from '@/components/AlertCard';
import EmptyState from '@/components/EmptyState';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { memberService } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';

// ─── Backend-shaped types ─────────────────────────────────────────────────────
interface MemberSummary {
  id: number;
  name: string;
  phone: string;
  status: string;
  planName: string | null;
  planEndDate: string | null;
  lastCheckIn: string | null;
  daysRemaining: number;
}

interface PaymentSummary {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  date: string;
  planName: string;
  status: string;
}

// ─── Internal alert shape extended with phone + raw context ───────────────────
interface RichAlert extends Alert {
  phone: string;       // member phone for deep-link
  rawAmount?: number;  // for payment alerts
}

// ─── Build WhatsApp / SMS message text ────────────────────────────────────────
function buildMessage(alert: RichAlert): string {
  switch (alert.type) {
    case 'expiry':
      return `Hi ${alert.memberName}, your plan at PowerHouse Fitness Studio ${alert.message}. Please renew soon to continue your fitness journey! Contact us for assistance.`;
    case 'payment':
      return `Hi ${alert.memberName}, ${alert.subMessage ?? 'a payment is overdue'} at PowerHouse Fitness Studio. Please clear your dues at the earliest. Thank you!`;
    case 'inactive':
      return `Hi ${alert.memberName}, we miss you at PowerHouse Fitness Studio! ${alert.message}. Come back and stay fit. Your health is our priority! 💪`;
    default:
      return `Hi ${alert.memberName}, you have a notification from PowerHouse Fitness Studio.`;
  }
}

// ─── Derive alerts from members + payments ────────────────────────────────────
function buildAlerts(members: MemberSummary[], duePayments: PaymentSummary[]): RichAlert[] {
  const alerts: RichAlert[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  for (const m of members) {
    // 1. Expiring soon (≤ 7 days)
    if (m.status === 'EXPIRING') {
      const days = m.daysRemaining;
      alerts.push({
        id: `expiry-${m.id}`,
        memberId: String(m.id),
        memberName: m.name,
        phone: m.phone ?? '',
        type: 'expiry',
        message: `Plan expires in ${days} day${days !== 1 ? 's' : ''}${m.planName ? ` · ${m.planName}` : ''}`,
        createdAt: today,
        isRead: false,
      });
    }

    // 2. Already expired
    if (m.status === 'EXPIRED') {
      alerts.push({
        id: `expired-${m.id}`,
        memberId: String(m.id),
        memberName: m.name,
        phone: m.phone ?? '',
        type: 'expiry',
        message: `Plan expired${m.planName ? ` · ${m.planName}` : ''}`,
        subMessage: m.planEndDate
          ? `Expired on ${new Date(m.planEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
          : undefined,
        createdAt: m.planEndDate ?? today,
        isRead: false,
      });
    }

    // 3. Inactive (no check-in for 14+ days)
    if (m.lastCheckIn) {
      const diffDays = Math.floor(
        (now.getTime() - new Date(m.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 14) {
        alerts.push({
          id: `inactive-${m.id}`,
          memberId: String(m.id),
          memberName: m.name,
          phone: m.phone ?? '',
          type: 'inactive',
          message: `No check-in in ${diffDays} days`,
          createdAt: today,
          isRead: true,
        });
      }
    }
  }

  // 4. Payment due
  for (const p of duePayments) {
    // Find phone from members
    const member = members.find(m => m.id === p.memberId);
    const sinceDate = p.date
      ? new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : null;
    alerts.push({
      id: `payment-${p.id}`,
      memberId: String(p.memberId),
      memberName: p.memberName,
      phone: member?.phone ?? '',
      type: 'payment',
      message: `Payment overdue${p.planName ? ` · ${p.planName}` : ''}`,
      subMessage: `₹${p.amount.toLocaleString('en-IN')} pending${sinceDate ? ` since ${sinceDate}` : ''}`,
      rawAmount: p.amount,
      createdAt: p.date ?? today,
      isRead: false,
    });
  }

  // Sort: unread first → payment → expiry → inactive
  const typePriority: Record<AlertType, number> = { payment: 0, expiry: 1, inactive: 2 };
  alerts.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return (typePriority[a.type] ?? 3) - (typePriority[b.type] ?? 3);
  });

  return alerts;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type FilterTab = 'all' | AlertType;
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'expiry',   label: 'Expiry'   },
  { key: 'payment',  label: 'Payments' },
  { key: 'inactive', label: 'Inactive' },
];

// ─── Notify bottom sheet ───────────────────────────────────────────────────────
interface NotifySheetProps {
  alert: RichAlert | null;
  onClose: () => void;
}

function NotifySheet({ alert, onClose }: NotifySheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (alert) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [alert]);

  if (!alert) return null;

  const message = buildMessage(alert);
  const phone   = alert.phone.replace(/\D/g, ''); // digits only
  const intlPhone = phone.startsWith('91') ? phone : `91${phone}`;

  const sendWhatsApp = async () => {
    const url = `whatsapp://send?phone=${intlPhone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    await Linking.openURL(canOpen ? url : webUrl);
    onClose();
  };

  const sendSMS = async () => {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:+${intlPhone}${separator}body=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
    onClose();
  };

  const callMember = async () => {
    await Linking.openURL(`tel:+${intlPhone}`);
    onClose();
  };

  return (
    <Modal transparent animationType="none" visible={!!alert} onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[sheet.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={sheet.handle} />

        {/* Member info */}
        <View style={sheet.member}>
          <View style={sheet.avatar}>
            <Text style={sheet.avatarText}>
              {alert.memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={sheet.memberName}>{alert.memberName}</Text>
            <Text style={sheet.memberPhone}>{alert.phone || 'No phone on record'}</Text>
          </View>
        </View>

        {/* Message preview */}
        <View style={sheet.previewBox}>
          <Text style={sheet.previewLabel}>Message Preview</Text>
          <Text style={sheet.previewText} numberOfLines={4}>{message}</Text>
        </View>

        {/* Action buttons */}
        <Text style={sheet.chooseLabel}>SEND VIA</Text>
        <View style={sheet.actionsRow}>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: '#25D366' }]} onPress={sendWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text style={sheet.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: Colors.accent }]} onPress={sendSMS}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={sheet.actionBtnText}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: Colors.primary }]} onPress={callMember}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={sheet.actionBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={sheet.cancelBtn} onPress={onClose}>
          <Text style={sheet.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: scale(20),
    paddingBottom: verticalScale(36),
    gap: verticalScale(14),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: Colors.border,
    borderRadius: moderateScale(4),
    alignSelf: 'center',
    marginBottom: verticalScale(4),
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#EDE0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  memberName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
  },
  memberPhone: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  previewBox: {
    backgroundColor: Colors.background,
    borderRadius: moderateScale(Layout.radius.sm),
    padding: moderateScale(12),
    gap: verticalScale(4),
  },
  previewLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    letterSpacing: 0.4,
  },
  previewText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  chooseLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(Layout.radius.sm),
  },
  actionBtnText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(Layout.radius.sm),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const [activeTab, setActiveTab]       = useState<FilterTab>('all');
  const [alerts, setAlerts]             = useState<RichAlert[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [notifyAlert, setNotifyAlert]   = useState<RichAlert | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const [members, duePayments] = await Promise.all([
        memberService.getAll() as Promise<MemberSummary[]>,
        paymentService.getDue() as Promise<PaymentSummary[]>,
      ]);
      setAlerts(buildAlerts(members, duePayments));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load alerts');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAlerts();
      setLoading(false);
    })();
  }, [fetchAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  // onAction from AlertCard → open notify sheet
  const handleAction = useCallback((alert: Alert) => {
    const rich = alerts.find(a => a.id === alert.id);
    if (rich) setNotifyAlert(rich);
  }, [alerts]);

  const closeSheet = useCallback(() => {
    setNotifyAlert(null);
    // Mark as read
    if (notifyAlert) {
      setAlerts(prev => prev.map(a => a.id === notifyAlert.id ? { ...a, isRead: true } : a));
    }
  }, [notifyAlert]);

  const filtered = activeTab === 'all' ? alerts : alerts.filter(a => a.type === activeTab);
  const unread   = alerts.filter(a => !a.isRead).length;

  return (
    <View style={styles.root}>
      <AppHeader
        title="Alerts"
        subtitle={unread > 0 ? `${unread} unread` : 'All clear'}
      />

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading alerts…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={onRefresh}>Tap to retry</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.id}
          renderItem={({ item }) => <AlertCard alert={item} onAction={handleAction} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-circle-outline"
              title="All clear!"
              subtitle="No alerts in this category"
            />
          }
        />
      )}

      {/* ── Notify bottom sheet ────────────────────────────────────────────── */}
      <NotifySheet alert={notifyAlert} onClose={closeSheet} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingHorizontal: scale(Layout.spacing.lg),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    position: 'relative',
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: scale(8),
    right: scale(8),
    height: verticalScale(2.5),
    backgroundColor: Colors.accent,
    borderRadius: moderateScale(2),
  },
  list:         { padding: scale(Layout.spacing.lg), paddingBottom: verticalScale(32) },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: verticalScale(8), padding: scale(24) },
  loadingText:  { ...Typography.body, color: Colors.textMuted, fontSize: moderateScale(Typography.body.fontSize ?? 14) },
  errorText:    { ...Typography.body, color: Colors.expiredRed, textAlign: 'center', fontSize: moderateScale(Typography.body.fontSize ?? 14) },
  retryText:    { ...Typography.body, color: Colors.accent, fontWeight: '600', fontSize: moderateScale(Typography.body.fontSize ?? 14) },
});