import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { revenueService, RevenueStats, ChartPoint } from '@/services/revenueService';
import { paymentService } from '@/services/paymentService';
import { Colors, Typography, Layout } from '../../constants/theme';
import { formatCurrency } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

// ─── Period tabs ──────────────────────────────────────────────────────────────
type Period = 'OVERALL' | 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'OVERALL', label: 'Overall' },
  { key: 'YEARLY',  label: 'Year'    },
  { key: 'MONTHLY', label: 'Month'   },
  { key: 'WEEKLY',  label: 'Week'    },
  { key: 'DAILY',   label: 'Today'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatBarLabel(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)   return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: ChartPoint[] }) {
  if (!data || data.length === 0) {
    return <Text style={barStyles.empty}>No data</Text>;
  }
  const maxVal = Math.max(...data.map(d => d.value), 1);
  // Show at most 12 bars; if more, sample evenly
  const bars = data.length <= 14 ? data : data.filter((_, i) => i % Math.ceil(data.length / 12) === 0);
  return (
    <View style={barStyles.container}>
      {bars.map((d, i) => {
        const isLast = i === bars.length - 1;
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <View key={i} style={barStyles.col}>
            <Text style={barStyles.valLabel}>{formatBarLabel(d.value)}</Text>
            <View style={barStyles.track}>
              <View
                style={[
                  barStyles.fill,
                  {
                    height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                    backgroundColor: isLast ? Colors.accent : Colors.softPink,
                  },
                ]}
              />
            </View>
            <Text style={barStyles.xLabel} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: scale(5),
    height: verticalScale(130),
    alignItems: 'flex-end',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: verticalScale(3),
  },
  track: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: moderateScale(4),
    minHeight: verticalScale(3),
  },
  valLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(9),
  },
  xLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(8),
  },
  empty: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: verticalScale(24),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
});

// ─── Payment record type ──────────────────────────────────────────────────────
interface PaymentRecord {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  date: string;
  planName: string;
  status: string;
  mode: string | null;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const NOW = new Date();

export default function RevenueScreen() {
  const [activePeriod, setActivePeriod] = useState<Period>('OVERALL');
  const [stats, setStats]               = useState<RevenueStats | null>(null);
  const [allPayments, setAllPayments]   = useState<PaymentRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Track the currently selected period to avoid stale state overwrites
  const periodRef = useRef<Period>(activePeriod);

  // ─── Fetch revenue stats for a given period ─────────────────────────────────
  const fetchStats = useCallback(async (period: Period) => {
    try {
      setError(null);
      let data: RevenueStats;
      switch (period) {
        case 'OVERALL': data = await revenueService.getOverall(); break;
        case 'YEARLY':  data = await revenueService.getYearly(NOW.getFullYear()); break;
        case 'MONTHLY': data = await revenueService.getMonthly(NOW.getFullYear(), NOW.getMonth() + 1); break;
        case 'WEEKLY':  data = await revenueService.getWeekly(toISODate(NOW)); break;
        case 'DAILY':   data = await revenueService.getDaily(toISODate(NOW)); break;
      }
      // Only update if user hasn't changed tab while awaiting
      if (periodRef.current === period) setStats(data);
    } catch (e: any) {
      if (periodRef.current === period) setError(e?.message ?? 'Failed to load revenue data');
    }
  }, []);

  // ─── Fetch recent payments for the bottom transaction list ──────────────────
  const fetchPayments = useCallback(async () => {
    try {
      const data = await paymentService.getAll();
      setAllPayments(data);
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchStats('OVERALL'), fetchPayments()]);
      setLoading(false);
    })();
  }, [fetchStats, fetchPayments]);

  // Period tab change
  const handlePeriodChange = useCallback(async (period: Period) => {
    periodRef.current = period;
    setActivePeriod(period);
    setStats(null);
    setError(null);
    await fetchStats(period);
  }, [fetchStats]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(activePeriod), fetchPayments()]);
    setRefreshing(false);
  }, [activePeriod, fetchStats, fetchPayments]);

  // ─── Plan breakdown (derived from allPayments) ─────────────────────────────
  const paidPayments = allPayments.filter(p => p.status === 'PAID');
  const planMap = new Map<string, { revenue: number; members: Set<number> }>();
  for (const p of paidPayments) {
    const key = p.planName ?? 'Unknown';
    if (!planMap.has(key)) planMap.set(key, { revenue: 0, members: new Set() });
    const entry = planMap.get(key)!;
    entry.revenue += p.amount;
    entry.members.add(p.memberId);
  }
  const planBreakdown = Array.from(planMap.entries())
    .map(([name, { revenue, members }]) => ({ name, revenue, memberCount: members.size }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxPlanRevenue = planBreakdown.length > 0 ? Math.max(...planBreakdown.map(p => p.revenue)) : 1;

  // ─── Recent transactions ────────────────────────────────────────────────────
  const recentTx = [...allPayments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AppHeader
        title="Revenue"
        subtitle={stats?.label ?? NOW.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
      />

      {/* ── Period tabs ───────────────────────────────────────────────────── */}
      <View style={styles.tabsRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={styles.tab}
            onPress={() => handlePeriodChange(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activePeriod === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
            {activePeriod === p.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading revenue…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={onRefresh}>Tap to retry</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
        >
          {/* ── Stat cards ─────────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={[styles.statValue, { color: Colors.activeGreen }]}>
                {formatCurrency(stats?.totalCollected ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={[styles.statValue, { color: Colors.expiredRed }]}>
                {formatCurrency(stats?.totalPending ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={[styles.statValue, { color: Colors.accent }]}>
                {stats?.transactionCount ?? 0}
              </Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>

          {/* ── Bar chart ──────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {activePeriod === 'OVERALL' ? 'Year-by-Year'
                : activePeriod === 'YEARLY'  ? 'Monthly Breakdown'
                : activePeriod === 'MONTHLY' ? 'Daily Breakdown'
                : activePeriod === 'WEEKLY'  ? 'Day-by-Day'
                : 'Daily Total'}
            </Text>
            {stats == null ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <BarChart data={stats.chartData} />
            )}
          </View>

          {/* ── Plans breakdown ─────────────────────────────────────────────── */}
          {planBreakdown.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Plans Breakdown</Text>
              <View style={styles.planList}>
                {planBreakdown.map(plan => (
                  <View key={plan.name} style={styles.planRowWrap}>
                    <View style={styles.planInfoRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planCount}>{plan.memberCount} member{plan.memberCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.planRevenue}>{formatCurrency(plan.revenue)}</Text>
                    <View style={styles.planBarTrack}>
                      <View
                        style={[
                          styles.planBarFill,
                          { width: `${(plan.revenue / maxPlanRevenue) * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Recent transactions ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {recentTx.length === 0 ? (
              <Text style={styles.emptyText}>No transactions found</Text>
            ) : (
              recentTx.map(tx => {
                const isPaid = tx.status === 'PAID';
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <Text style={styles.txName}>{tx.memberName}</Text>
                      <Text style={styles.txPlan}>
                        {tx.planName ? `${tx.planName} · ` : ''}
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                      <View
                        style={[
                          styles.txBadge,
                          { backgroundColor: isPaid ? Colors.activeBg : Colors.expiredBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.txBadgeText,
                            { color: isPaid ? Colors.activeText : Colors.expiredText },
                          ]}
                        >
                          {isPaid ? 'Paid' : 'Due'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Period tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingHorizontal: scale(Layout.spacing.md),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(11),
    position: 'relative',
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: moderateScale(11),
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: scale(4),
    right: scale(4),
    height: verticalScale(2.5),
    backgroundColor: Colors.accent,
    borderRadius: moderateScale(2),
  },

  // Layout
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(8),
    padding: scale(24),
  },
  content: {
    padding: scale(Layout.spacing.lg),
    gap: verticalScale(14),
    paddingBottom: verticalScale(32),
  },

  // Feedback
  loadingText: { ...Typography.body, color: Colors.textMuted, fontSize: moderateScale(14) },
  errorText:   { ...Typography.body, color: Colors.expiredRed, textAlign: 'center', fontSize: moderateScale(14) },
  retryText:   { ...Typography.body, color: Colors.accent, fontWeight: '600', fontSize: moderateScale(14) },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: scale(8) },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(12),
    gap: verticalScale(4),
    alignItems: 'center',
  },
  statValue: { ...Typography.heading2, fontSize: moderateScale(18) },
  statLabel: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(11), textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(Layout.cardPadding),
    gap: verticalScale(14),
  },
  cardTitle: { ...Typography.heading3, color: Colors.textPrimary, fontSize: moderateScale(15) },

  // Plans
  planList:    { gap: verticalScale(14) },
  planRowWrap: { gap: verticalScale(5) },
  planInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName:    { ...Typography.body, fontWeight: '600', color: Colors.textPrimary, fontSize: moderateScale(13) },
  planCount:   { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(11) },
  planRevenue: { ...Typography.body, fontWeight: '700', color: Colors.accent, fontSize: moderateScale(13) },
  planBarTrack: { height: verticalScale(6), backgroundColor: Colors.background, borderRadius: moderateScale(4), overflow: 'hidden' },
  planBarFill:  { height: '100%', backgroundColor: Colors.accent, borderRadius: moderateScale(4) },

  // Transactions
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', fontSize: moderateScale(14) },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  txLeft:   { flex: 1, marginRight: scale(8) },
  txName:   { ...Typography.body, fontWeight: '600', color: Colors.textPrimary, fontSize: moderateScale(13) },
  txPlan:   { ...Typography.caption, color: Colors.textMuted, marginTop: verticalScale(1), fontSize: moderateScale(11) },
  txRight:  { alignItems: 'flex-end', gap: verticalScale(4) },
  txAmount: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary, fontSize: moderateScale(13) },
  txBadge:  { paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: moderateScale(Layout.radius.full) },
  txBadgeText: { ...Typography.label, fontWeight: '600', fontSize: moderateScale(10) },
});