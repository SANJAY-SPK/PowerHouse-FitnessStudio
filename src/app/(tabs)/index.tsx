import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import { formatCurrency } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import AlertCard from '@/components/AlertCard';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { useDashboardStore } from '@/store/dashboardStore';
import { useMemberStore } from '@/store/memberStore';
import { useAlertStore } from '@/store/alertStore';
import { memberService } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';
import { alertSettingsService } from '@/services/alertSettingsService';
import { Alert } from '@/types/Alert';

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Add',  route: '/(members)/memberForm', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  { icon: 'wallet-outline'     as const, label: 'Payment',     route: '/(tabs)/revenue',       color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  { icon: 'scan-outline'       as const, label: 'Check In',    route: '/(tabs)/checkin',       color: Colors.accent, bg: 'rgba(152,37,152,0.12)' },
  { icon: 'stats-chart-outline' as const, label: 'Reports',   route: '/(tabs)/revenue',       color: '#0284C7', bg: 'rgba(2,132,199,0.12)' },
];

function buildAlerts(members: any[], duePayments: any[], inactiveDays: number): Alert[] {
  const alertsList: Alert[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  for (const m of members) {
    if (m.status === 'EXPIRING') {
      const days = m.daysRemaining;
      alertsList.push({
        id: `expiry-${m.id}`,
        memberId: String(m.id),
        memberName: m.name,
        type: 'expiry',
        message: `Plan expires in ${days} day${days !== 1 ? 's' : ''}${m.planName ? ` · ${m.planName}` : ''}`,
        createdAt: today,
        isRead: false,
      });
    }

    if (m.status === 'EXPIRED') {
      alertsList.push({
        id: `expired-${m.id}`,
        memberId: String(m.id),
        memberName: m.name,
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
      if (diffDays >= inactiveDays) {
        alertsList.push({
          id: `inactive-${m.id}`,
          memberId: String(m.id),
          memberName: m.name,
          type: 'inactive',
          message: `No check-in in ${diffDays} days`,
          createdAt: today,
          isRead: true,
        });
      }
    }
  }

  for (const p of duePayments) {
    const sinceDate = p.date
      ? new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : null;
    alertsList.push({
      id: `payment-${p.id}`,
      memberId: String(p.memberId),
      memberName: p.memberName,
      type: 'payment',
      message: `Payment overdue${p.planName ? ` · ${p.planName}` : ''}`,
      subMessage: `₹${p.amount.toLocaleString('en-IN')} pending${sinceDate ? ` since ${sinceDate}` : ''}`,
      createdAt: p.date ?? today,
      isRead: false,
    });
  }

  const typePriority: Record<string, number> = { payment: 0, expiry: 1, inactive: 2 };
  alertsList.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return (typePriority[a.type] ?? 3) - (typePriority[b.type] ?? 3);
  });

  return alertsList;
}

const STAT_CONFIG = [
  { key: 'activeMembers',    label: 'Active Members',      icon: 'people'           as const, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  { key: 'expiringThisWeek', label: 'Expiring This Week',  icon: 'time'             as const, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'totalCollected',   label: 'Revenue (Month)',     icon: 'cash'             as const, color: Colors.accent, bg: 'rgba(152,37,152,0.1)', isCurrency: true },
  { key: 'overduePayments',  label: 'Overdue Dues',        icon: 'alert-circle'     as const, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
];

export default function DashboardScreen() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const { stats, isLoading: statsLoading, fetchStats } = useDashboardStore();
  const { members, isLoading: membersLoading, fetchMembers } = useMemberStore();
  const { unreadCount, fetchUnreadCount } = useAlertStore();
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadAlerts = async () => {
    try {
      const [settings, membersData, duePayments] = await Promise.all([
        alertSettingsService.load(),
        memberService.getAll(),
        paymentService.getDue(),
      ]);
      setAlerts(buildAlerts(membersData, duePayments, settings.inactiveDays));
    } catch (err) {
      console.error('Failed to load alerts for dashboard:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMembers();
    fetchUnreadCount();
    loadAlerts();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchMembers(),
      fetchUnreadCount(),
      loadAlerts(),
    ]);
    setRefreshing(false);
  }, []);

  const recentMembers = members.slice(0, 3);
  const todayAlerts = alerts.slice(0, 3);

  const getStatValue = (key: string) => {
    if (!stats) return 0;
    return (stats as any)[key] ?? 0;
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Power House FS"
        greeting={`${greeting}, Admin`}
        subtitle={today}
        rightIcon="settings-outline"
        onRightPress={() => router.push('/settings')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.accent]}
            tintColor={Colors.accent}
          />
        }
      >
        {/* ── Hero Banner ───────────────────────────────────────────── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerInner}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroLabel}>TODAY'S SNAPSHOT</Text>
            <Text style={styles.heroDate}>{today}</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.heroBadge}
                onPress={() => router.push('/(tabs)/alerts')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}>{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>OVERVIEW</Text>
        </View>
        {statsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>Loading stats…</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STAT_CONFIG.map(cfg => {
              const raw = getStatValue(cfg.key);
              const display = cfg.isCurrency ? formatCurrency(raw) : String(raw);
              return (
                <View key={cfg.key} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <Text style={[styles.statValue, { color: cfg.color }]}>{display}</Text>
                  <Text style={styles.statLabel}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Alerts ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.expiredRed }]} />
              <Text style={styles.sectionTitle}>Today's Alerts</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/(tabs)/alerts')}
            >
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          {todayAlerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconBox, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.activeGreen} />
              </View>
              <View>
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptyText}>No alerts for today</Text>
              </View>
            </View>
          ) : (
            todayAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </View>

        {/* ── Recent Members ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.sectionTitle}>Recent Members</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/(tabs)/members')}
            >
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          {membersLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 8 }} />
          ) : recentMembers.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconBox, { backgroundColor: 'rgba(21,23,61,0.06)' }]}>
                <Ionicons name="people-outline" size={22} color={Colors.textMuted} />
              </View>
              <View>
                <Text style={styles.emptyTitle}>No Members Yet</Text>
                <Text style={styles.emptyText}>Add your first member via Quick Actions</Text>
              </View>
            </View>
          ) : (
            <View style={styles.memberList}>
              {recentMembers.map((member, idx) => {
                const statusColor =
                  member.status === 'ACTIVE'   ? Colors.activeGreen :
                  member.status === 'EXPIRING' ? Colors.expiringAmber :
                  member.status === 'EXPIRED'  ? Colors.expiredRed
                                               : Colors.pausedGray;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.recentCard,
                      idx < recentMembers.length - 1 && styles.recentCardBorder,
                    ]}
                    onPress={() => router.push({
                      pathname: '/(members)/memberDetail',
                      params: { id: member.id },
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: `${statusColor}20` }]}>
                      <Text style={[styles.memberAvatarText, { color: statusColor }]}>
                        {member.name.trim().split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.recentName}>{member.name}</Text>
                      <Text style={styles.recentPlan}>{member.planName ?? '—'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {member.status}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: scale(Layout.spacing.lg),
    paddingBottom: verticalScale(120),
    gap: verticalScale(4),
  },

  // Hero Banner
  heroBanner: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginBottom: verticalScale(16),
    backgroundColor: Colors.primary,
  },
  heroBannerInner: {
    padding: moderateScale(18),
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(152,37,152,0.35)',
  },
  heroLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: 'rgba(241,233,233,0.5)',
    letterSpacing: 1.5,
    marginBottom: verticalScale(4),
  },
  heroDate: {
    ...Typography.body,
    color: '#F1E9E9',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginTop: verticalScale(10),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.7)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },

  // Section labels
  sectionLabel: {
    marginBottom: verticalScale(8),
  },
  sectionLabelText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: verticalScale(20),
    padding: moderateScale(14),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(4),
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  statCard: {
    width: '49%',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: moderateScale(20),
    gap: verticalScale(4),   
  },
  statIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: verticalScale(2),
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: verticalScale(20),
  },
  actionCard: {
    flex: 1,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: moderateScale(12),
    alignItems: 'center',
    gap: verticalScale(8),
    height: verticalScale(80),
  },
  actionIconBox: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(11),
    flexWrap: 'wrap',
  },

  // Section headers
  section: {
    marginBottom: verticalScale(8),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  sectionDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
  },
  viewAll: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },

  // Empty card
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    padding: moderateScale(14),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },

  // Member list
  memberList: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
  },
  recentCardBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  memberInfo: {
    flex: 1,
  },
  recentName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  recentPlan: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(20),
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});