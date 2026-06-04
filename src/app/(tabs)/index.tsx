import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '@/context/MembersContext';
import { Colors, Typography, Layout } from '@/constants/theme';
import { formatCurrency } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import StatCard from '@/components/StatCard';
import AlertCard from '@/components/AlertCard';
import { Alert } from '@/types/Alert';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
const mockAlerts: Alert[] = [
  { id: 'a1', memberId: '1', memberName: 'Arjun Mehta', type: 'expiry', message: 'Plan expires in 2 days · Monthly Pro', createdAt: '2026-05-28', isRead: false },
  { id: 'a2', memberId: '4', memberName: 'Riya Nair', type: 'payment', message: 'Payment overdue · Plan expired', subMessage: '₹800 pending', createdAt: '2026-05-28', isRead: false },
  { id: 'a3', memberId: '3', memberName: 'Karthik R', type: 'inactive', message: 'No check-in in 18 days', createdAt: '2026-05-28', isRead: false },
];

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Add Member' },
  { icon: 'wallet-outline' as const, label: 'Payment' },
  { icon: 'scan-outline' as const, label: 'Check In' },
  { icon: 'stats-chart-outline' as const, label: 'Reports' },
];

export default function DashboardScreen() {
  const { members } = useMembers();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    const active = members.filter(m => m.status === 'active' || m.status === 'expiring').length;
    const expiring = members.filter(m => m.status === 'expiring').length;
    const overdue = members.filter(m => m.payments.some(p => p.status === 'due')).length;
    const revenue = members.reduce((sum, m) => sum + m.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), 0);
    return { active, expiring, overdue, revenue };
  }, [members]);

  return (
    <View style={styles.root}>
      <AppHeader
        title="Power House FS"
        greeting="Good morning, Admin"
        subtitle={today}
        rightIcon="notifications-outline"
        rightBadge={3}
        onRightPress={() => router.push('/(tabs)/alerts')}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard label="Active Members" value={stats.active} dotColor={Colors.activeGreen} />
            <StatCard label="Expiring This Week" value={stats.expiring} dotColor={Colors.expiringAmber} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Revenue — May" value={formatCurrency(stats.revenue)} dotColor={Colors.accent} valueColor={Colors.accent} />
            <StatCard label="Overdue Dues" value={stats.overdue} dotColor={Colors.expiredRed} valueColor={Colors.expiredRed} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.7}>
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
          {mockAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </View>

        {/* Recent Members */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Members</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/members')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {members.slice(0, 3).map(member => (
            <TouchableOpacity
              key={member.id}
              style={styles.recentCard}
              onPress={() => router.push({ pathname: '/(members)/memberDetail', params: { id: member.id } })}
              activeOpacity={0.7}
            >
              <View style={[styles.recentDot, {
                backgroundColor:
                  member.status === 'active' ? Colors.activeGreen :
                    member.status === 'expiring' ? Colors.expiringAmber :
                      member.status === 'expired' ? Colors.expiredRed : Colors.pausedGray
              }]} />
              <Text style={styles.recentName}>{member.name}</Text>
              <Text style={styles.recentPlan}>{member.planName}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
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
    gap: verticalScale(12),
  },
  content: {
    padding: scale(Layout.spacing.lg),
    gap: 0,
    paddingBottom: verticalScale(32),
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
    flex: 1,
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
});