import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import { formatCurrency } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import StatCard from '@/components/StatCard';
import AlertCard from '@/components/AlertCard';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { useDashboardStore } from '@/store/dashboardStore';
import { useMemberStore } from '@/store/memberStore';
import { useAlertStore } from '@/store/alertStore';
import { memberService } from '@/services/memberService';
import { paymentService } from '@/services/paymentService';
import { Alert } from '@/types/Alert';

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Add Member',  route: '/(members)/memberForm' },
  { icon: 'wallet-outline'     as const, label: 'Payment',     route: '/(tabs)/revenue' },
  { icon: 'scan-outline'       as const, label: 'Check In',    route: '/(members)/checkin' },
  { icon: 'stats-chart-outline' as const, label: 'Reports',   route: '/(tabs)/revenue' },
];

function buildAlerts(members: any[], duePayments: any[]): Alert[] {
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
      if (diffDays >= 14) {
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

export default function DashboardScreen() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const { stats, isLoading: statsLoading, fetchStats } = useDashboardStore();
  const { members, isLoading: membersLoading, fetchMembers } = useMemberStore();
  const { unreadCount, fetchUnreadCount } = useAlertStore();
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  const loadAlerts = async () => {
    try {
      const [membersData, duePayments] = await Promise.all([
        memberService.getAll(),
        paymentService.getDue(),
      ]);
      setAlerts(buildAlerts(membersData, duePayments));
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

  const recentMembers = members.slice(0, 3);
  const todayAlerts = alerts.slice(0, 3);

  return (
    <View style={styles.root}>
      <AppHeader
        title="Power House FS"
        greeting="Good morning, Admin"
        subtitle={today}
        rightIcon="notifications-outline"
        rightBadge={unreadCount}
        onRightPress={() => router.push('/(tabs)/alerts')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Stats Grid */}
        {statsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>Loading stats…</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                label="Active Members"
                value={stats?.activeMembers ?? 0}
                dotColor={Colors.activeGreen}
              />
              <StatCard
                label="Expiring This Week"
                value={stats?.expiringThisWeek ?? 0}
                dotColor={Colors.expiringAmber}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Revenue — May"
                value={formatCurrency(stats?.totalCollected ?? 0)}
                dotColor={Colors.accent}
                valueColor={Colors.accent}
              />
              <StatCard
                label="Overdue Dues"
                value={stats?.overduePayments ?? 0}
                dotColor={Colors.expiredRed}
                valueColor={Colors.expiredRed}
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={() => router.push(a.route as any)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon} size={22} color={Colors.accent} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Today's Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {todayAlerts.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.activeGreen} />
              <Text style={styles.emptyText}>No alerts today</Text>
            </View>
          ) : (
            todayAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </View>

        {/* Recent Members */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Members</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/members')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {membersLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 8 }} />
          ) : recentMembers.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="people-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No members yet</Text>
            </View>
          ) : (
            recentMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                style={styles.recentCard}
                onPress={() => router.push({
                  pathname: '/(members)/memberDetail',
                  params: { id: member.id },
                })}
                activeOpacity={0.7}
              >
                <View style={[styles.recentDot, {
                  backgroundColor:
                    member.status === 'ACTIVE'    ? Colors.activeGreen :
                    member.status === 'EXPIRING'  ? Colors.expiringAmber :
                    member.status === 'EXPIRED'   ? Colors.expiredRed
                                                  : Colors.pausedGray,
                }]} />
                <Text style={styles.recentName}>{member.name}</Text>
                <Text style={styles.recentPlan}>{member.planName}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.textMuted}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            ))
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: scale(Layout.spacing.lg),
    paddingBottom: verticalScale(32),
  },
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
  statsGrid: {
    gap: verticalScale(8),
    marginBottom: verticalScale(20),
  },
  statsRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.heading3.fontSize ?? 16),
  },
  viewAll: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(8),
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(12),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(6),
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(6),
  },
  actionIcon: {
    backgroundColor: Colors.surface,
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(Layout.radius.md),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(6),
  },
  recentDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  recentName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  recentPlan: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: moderateScale(12),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});