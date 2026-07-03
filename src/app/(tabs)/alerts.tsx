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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert, AlertType } from '@/types/Alert';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import AlertCard from '@/components/AlertCard';
import EmptyState from '@/components/EmptyState';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { memberService } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';
import { alertSettingsService, AlertSettings } from '@/services/alertSettingsService';

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

interface RichAlert extends Alert {
  phone: string;
  rawAmount?: number;
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
function buildAlerts(
  members: MemberSummary[],
  duePayments: PaymentSummary[],
  settings: AlertSettings
): RichAlert[] {
  const alerts: RichAlert[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  for (const m of members) {
    if (m.status === 'EXPIRING' || (m.daysRemaining >= 0 && m.daysRemaining <= settings.leadTime)) {
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

    if (m.lastCheckIn) {
      const diffDays = Math.floor(
        (now.getTime() - new Date(m.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= settings.inactiveDays) {
        alerts.push({
          id: `inactive-${m.id}`,
          memberId: String(m.id),
          memberName: m.name,
          phone: m.phone ?? '',
          type: 'inactive',
          message: `No check-in in ${diffDays} days (threshold: ${settings.inactiveDays} days)`,
          createdAt: today,
          isRead: true,
        });
      }
    }
  }

  for (const p of duePayments) {
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

  const typePriority: Record<AlertType, number> = { payment: 0, expiry: 1, inactive: 2 };
  alerts.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return (typePriority[a.type] ?? 3) - (typePriority[b.type] ?? 3);
  });

  const seen = new Set<string>();
  return alerts.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type FilterTab = 'all' | AlertType;
const TABS: { key: FilterTab; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'all',      label: 'All',      icon: 'apps-outline',          color: Colors.primary    },
  { key: 'expiry',   label: 'Expiry',   icon: 'time-outline',          color: Colors.expiringAmber },
  { key: 'payment',  label: 'Payments', icon: 'wallet-outline',        color: Colors.expiredRed    },
  { key: 'inactive', label: 'Inactive', icon: 'person-remove-outline', color: Colors.pausedGray    },
];

// ─── Notify bottom sheet ───────────────────────────────────────────────────────
interface NotifySheetProps {
  alert: RichAlert | null;
  onClose: () => void;
}

function NotifySheet({ alert, onClose }: NotifySheetProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (alert) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [alert]);

  if (!alert) return null;

  const message = buildMessage(alert);
  const phone   = alert.phone.replace(/\D/g, '');
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

  const initials = alert.memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Modal transparent animationType="none" visible={!!alert} onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[sheet.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={sheet.handle} />

        {/* Member info */}
        <View style={sheet.member}>
          <View style={sheet.avatar}>
            <Text style={sheet.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sheet.memberName}>{alert.memberName}</Text>
            <Text style={sheet.memberPhone}>{alert.phone || 'No phone on record'}</Text>
          </View>
          <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Message preview */}
        <View style={sheet.previewBox}>
          <Text style={sheet.previewLabel}>MESSAGE PREVIEW</Text>
          <Text style={sheet.previewText} numberOfLines={4}>{message}</Text>
        </View>

        {/* Action buttons */}
        <Text style={sheet.chooseLabel}>SEND NOTIFICATION VIA</Text>
        <View style={sheet.actionsRow}>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: '#25D366' }]} onPress={sendWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={sheet.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: Colors.accent }]} onPress={sendSMS}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={sheet.actionBtnText}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: Colors.primary }]} onPress={callMember}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={sheet.actionBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: scale(20),
    paddingBottom: verticalScale(40),
    gap: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: Colors.border,
    borderRadius: moderateScale(4),
    alignSelf: 'center',
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(152,37,152,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '800',
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
  closeBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    backgroundColor: Colors.background,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    gap: verticalScale(6),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  previewText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
  },
  chooseLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Colors.textMuted,
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
    paddingVertical: verticalScale(13),
    borderRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
});

// ─── Alert type config ─────────────────────────────────────────────────────────
const ALERT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  expiry:  { label: 'Expiry',   color: Colors.expiringAmber, bg: 'rgba(245,158,11,0.1)' },
  payment: { label: 'Payment',  color: Colors.expiredRed,    bg: 'rgba(239,68,68,0.1)'  },
  inactive:{ label: 'Inactive', color: Colors.pausedGray,    bg: 'rgba(156,163,175,0.1)'},
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const [activeTab, setActiveTab]       = useState<FilterTab>('all');
  const [alerts, setAlerts]             = useState<RichAlert[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [notifyAlert, setNotifyAlert]   = useState<RichAlert | null>(null);
  const [settings, setSettings]         = useState<AlertSettings>({ leadTime: 7, inactiveDays: 14 });

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const [loadedSettings, members, duePayments] = await Promise.all([
        alertSettingsService.load(),
        memberService.getAll() as Promise<MemberSummary[]>,
        paymentService.getDue() as Promise<PaymentSummary[]>,
      ]);
      setSettings(loadedSettings);
      setAlerts(buildAlerts(members, duePayments, loadedSettings));
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

  const handleAction = useCallback((alert: Alert) => {
    const rich = alerts.find(a => a.id === alert.id);
    if (rich) setNotifyAlert(rich);
  }, [alerts]);

  const closeSheet = useCallback(() => {
    setNotifyAlert(null);
    if (notifyAlert) {
      setAlerts(prev => prev.map(a => a.id === notifyAlert.id ? { ...a, isRead: true } : a));
    }
  }, [notifyAlert]);

  const filtered = activeTab === 'all' ? alerts : alerts.filter(a => a.type === activeTab);
  const unread   = alerts.filter(a => !a.isRead).length;

  // Count per type
  const countByType = (type: FilterTab) =>
    type === 'all' ? alerts.length : alerts.filter(a => a.type === type).length;

  return (
    <View style={styles.root}>
      <AppHeader
        title="Alerts"
        subtitle={unread > 0 ? `${unread} unread` : 'All clear'}
      />

      {/* Settings info banner */}
      <View style={styles.settingsBanner}>
        <Ionicons name="settings-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.settingsBannerText}>
          Inactive: {settings.inactiveDays}d · Expiry lead: {settings.leadTime}d
        </Text>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unread}</Text>
          </View>
        )}
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = countByType(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? tab.color : Colors.textMuted}
                />
                <Text style={[styles.tabText, isActive && { color: tab.color, fontWeight: '700' }]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, isActive && { backgroundColor: `${tab.color}20` }]}>
                    <Text style={[styles.tabCountText, isActive && { color: tab.color }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading alerts…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorIconBox}>
            <Ionicons name="alert-circle" size={32} color={Colors.expiredRed} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Tap to Retry</Text>
          </TouchableOpacity>
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

      {/* ── Notify bottom sheet ─────────────────────────────────────────────── */}
      <NotifySheet alert={notifyAlert} onClose={closeSheet} />
    </View>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  settingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(Layout.spacing.lg),
    paddingVertical: verticalScale(7),
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingsBannerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.expiredRed,
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },

  tabsContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(Layout.spacing.lg),
    gap: scale(4),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(10),
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginRight: scale(2),
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: moderateScale(12),
  },
  tabCount: {
    backgroundColor: Colors.background,
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    alignItems: 'center',
  },
  tabCountText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: Colors.textMuted,
  },

  list: { padding: scale(Layout.spacing.lg), paddingBottom: verticalScale(100) },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
    padding: scale(24),
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: moderateScale(14),
  },
  errorIconBox: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.expiredRed,
    textAlign: 'center',
    fontSize: moderateScale(14),
  },
  retryBtn: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    backgroundColor: 'rgba(152,37,152,0.08)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
});