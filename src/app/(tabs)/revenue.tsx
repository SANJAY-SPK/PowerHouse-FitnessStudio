import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useMembers } from '@/context/MembersContext';
import { mockPlans } from '../../data/mockPlans';
import { Colors, Typography, Layout } from '../../constants/theme';
import { formatCurrency } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

const MONTHLY_DATA = [
  { month: 'Dec', value: 68000 },
  { month: 'Jan', value: 74000 },
  { month: 'Feb', value: 71000 },
  { month: 'Mar', value: 78000 },
  { month: 'Apr', value: 76000 },
  { month: 'May', value: 82400 },
];
const MAX_VALUE = Math.max(...MONTHLY_DATA.map(d => d.value));

export default function RevenueScreen() {
  const { members } = useMembers();
  const totalCollected = members.reduce((sum, m) =>
    sum + m.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), 0
  );
  const totalPending = members.reduce((sum, m) =>
    sum + m.payments.filter(p => p.status === 'due').reduce((s, p) => s + p.amount, 0), 0
  );

  const planBreakdown = mockPlans.map(plan => {
    const planMembers = members.filter(m => m.planId === plan.id);
    const revenue = planMembers.reduce((sum, m) =>
      sum + m.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), 0
    );
    return { ...plan, memberCount: planMembers.length, revenue };
  }).filter(p => p.revenue > 0);

  const maxPlanRevenue = planBreakdown.length > 0 ? Math.max(...planBreakdown.map(p => p.revenue)) : 0;

  return (
    <View style={styles.root}>
      <AppHeader title="Revenue" subtitle="May 2026" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statValue, { color: Colors.activeGreen }]}>{formatCurrency(totalCollected)}</Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statValue, { color: Colors.expiredRed }]}>{formatCurrency(totalPending)}</Text>
            <Text style={styles.statLabel}>Pending Dues</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 6 Months</Text>
          <View style={styles.chart}>
            {MONTHLY_DATA.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValue}>{Math.round(d.value / 1000)}k</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    height: `${(d.value / MAX_VALUE) * 100}%`,
                    backgroundColor: i === MONTHLY_DATA.length - 1 ? Colors.accent : Colors.softPink,
                  }]} />
                </View>
                <Text style={styles.barMonth}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plans Breakdown</Text>
          <View style={styles.planList}>
            {planBreakdown.map(plan => (
              <View key={plan.id} style={styles.planRow}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planCount}>{plan.memberCount} members</Text>
                </View>
                <Text style={styles.planRevenue}>{formatCurrency(plan.revenue)}</Text>
                <View style={styles.planBarWrap}>
                  <View style={[styles.planBar, { width: `${(plan.revenue / maxPlanRevenue) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          {members.flatMap(m =>
            m.payments.map(p => ({ ...p, memberName: m.name, memberId: m.id }))
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txName}>{tx.memberName}</Text>
                <Text style={styles.txPlan}>{tx.planName} · {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                <View style={[styles.txBadge, { backgroundColor: tx.status === 'paid' ? Colors.activeBg : Colors.expiredBg }]}>
                  <Text style={[styles.txBadgeText, { color: tx.status === 'paid' ? Colors.activeText : Colors.expiredText }]}>
                    {tx.status === 'paid' ? 'Paid' : 'Due'}
                  </Text>
                </View>
              </View>
            </View>
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
  content: {
    padding: scale(Layout.spacing.lg),
    gap: verticalScale(14),
    paddingBottom: verticalScale(32),
  },
  statsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(Layout.cardPadding),
    gap: verticalScale(4),
  },
  statValue: {
    ...Typography.heading2,
    fontSize: moderateScale(Typography.heading2.fontSize ?? 24),
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(Layout.cardPadding),
    gap: verticalScale(14),
  },
  cardTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.heading3.fontSize ?? 16),
  },
  chart: {
    flexDirection: 'row',
    gap: scale(8),
    height: verticalScale(120),
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(4),
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: moderateScale(4),
    minHeight: verticalScale(6),
  },
  barMonth: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
  planList: {
    gap: verticalScale(14),
  },
  planRow: {
    gap: verticalScale(6),
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  planCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  planRevenue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.accent,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  planBarWrap: {
    height: verticalScale(6),
    backgroundColor: Colors.background,
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  planBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: moderateScale(4),
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  txName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  txPlan: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(1),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  txRight: {
    alignItems: 'flex-end',
    gap: verticalScale(4),
  },
  txAmount: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  txBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(Layout.radius.full),
  },
  txBadgeText: {
    ...Typography.label,
    fontWeight: '600',
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
});