import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, FlatList, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { revenueService, RevenueStats } from '@/services/revenueService';
import { paymentService, PaymentRecord } from '@/services/paymentService';
import { formatCurrency } from '@/utils/helper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// ─── Period tabs ───────────────────────────────────────────────────────────────
type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
const PERIODS: { key: Period; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'DAILY',   label: 'Day',   icon: 'today-outline'     },
  { key: 'WEEKLY',  label: 'Week',  icon: 'calendar-outline'  },
  { key: 'MONTHLY', label: 'Month', icon: 'bar-chart-outline' },
  { key: 'YEARLY',  label: 'Year',  icon: 'trending-up-outline'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekBounds(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
}

function getLedgerRange(period: Period, year: number, month: number): { from: string; to: string } {
  const today = todayYMD();
  if (period === 'DAILY')   return { from: today, to: today };
  if (period === 'WEEKLY')  return weekBounds(today);
  if (period === 'MONTHLY') {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const last = new Date(year, month, 0);
    const to   = `${year}-${String(month).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { from, to };
  }
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

// ─── Week list for a given month ──────────────────────────────────────────────
interface WeekRange { label: string; from: string; to: string; }
function getWeeksInMonth(year: number, month: number): WeekRange[] {
  const weeks: WeekRange[] = [];
  // Iterate each day of the month and collect unique Mon–Sun ranges
  const seen = new Set<string>();
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const bounds = weekBounds(date.toISOString().slice(0, 10));
    const key = bounds.from;
    if (!seen.has(key)) {
      seen.add(key);
      const fromDate = new Date(bounds.from + 'T00:00:00');
      const toDate   = new Date(bounds.to   + 'T00:00:00');
      const fmt = (dt: Date) =>
        dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      weeks.push({ label: `${fmt(fromDate)} – ${fmt(toDate)}`, from: bounds.from, to: bounds.to });
    }
  }
  return weeks;
}

// ─── Month names ──────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ─── Period Picker Modal ───────────────────────────────────────────────────────
interface PeriodPickerModalProps {
  visible: boolean;
  period: Period;
  selectedDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

function PeriodPickerModal({
  visible, period, selectedDate, onConfirm, onCancel,
}: PeriodPickerModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;

  // Picker-local state
  const [pickerYear,  setPickerYear]  = useState(selectedDate.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(selectedDate.getMonth() + 1);

  useEffect(() => {
    if (visible) {
      setPickerYear(selectedDate.getFullYear());
      setPickerMonth(selectedDate.getMonth() + 1);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (period === 'DAILY') {
    return (
      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        date={selectedDate}
        onConfirm={onConfirm}
        onCancel={onCancel}
        accentColor={Colors.accent}
      />
    );
  }

  const confirmMonth = (m: number) => {
    const d = new Date(pickerYear, m - 1, 1);
    onConfirm(d);
  };

  const confirmYear = (y: number) => {
    const d = new Date(y, selectedDate.getMonth(), 1);
    onConfirm(d);
  };

  const confirmWeek = (from: string) => {
    const d = new Date(from + 'T00:00:00');
    onConfirm(d);
  };

  const weeks = period === 'WEEKLY' ? getWeeksInMonth(pickerYear, pickerMonth) : [];

  // Year range: current year ±4
  const baseYear = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => baseYear - 4 + i);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onCancel}>
      <TouchableOpacity style={pickerSheet.overlay} activeOpacity={1} onPress={onCancel} />
      <Animated.View style={[pickerSheet.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={pickerSheet.handle} />

        {/* Header */}
        <View style={pickerSheet.header}>
          <Text style={pickerSheet.title}>
            {period === 'MONTHLY' ? 'Select Month'
              : period === 'YEARLY' ? 'Select Year'
              : 'Select Week'}
          </Text>
          <TouchableOpacity style={pickerSheet.closeBtn} onPress={onCancel}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Year navigator — shown for MONTHLY and WEEKLY */}
        {(period === 'MONTHLY' || period === 'WEEKLY') && (
          <View style={pickerSheet.yearNav}>
            <TouchableOpacity
              style={pickerSheet.yearArrow}
              onPress={() => setPickerYear(y => y - 1)}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.accent} />
            </TouchableOpacity>
            <Text style={pickerSheet.yearLabel}>{pickerYear}</Text>
            <TouchableOpacity
              style={pickerSheet.yearArrow}
              onPress={() => setPickerYear(y => y + 1)}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Month navigator — shown for WEEKLY only */}
        {period === 'WEEKLY' && (
          <View style={[pickerSheet.yearNav, { marginTop: -verticalScale(4) }]}>
            <TouchableOpacity
              style={pickerSheet.yearArrow}
              onPress={() => {
                if (pickerMonth === 1) { setPickerMonth(12); setPickerYear(y => y - 1); }
                else setPickerMonth(m => m - 1);
              }}
            >
              <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={pickerSheet.monthLabel}>{MONTH_NAMES[pickerMonth - 1]}</Text>
            <TouchableOpacity
              style={pickerSheet.yearArrow}
              onPress={() => {
                if (pickerMonth === 12) { setPickerMonth(1); setPickerYear(y => y + 1); }
                else setPickerMonth(m => m + 1);
              }}
            >
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── MONTHLY: 3×4 month grid ─────────────────────────────────── */}
        {period === 'MONTHLY' && (
          <View style={pickerSheet.monthGrid}>
            {MONTH_NAMES.map((name, idx) => {
              const m = idx + 1;
              const isActive =
                m === selectedDate.getMonth() + 1 &&
                pickerYear === selectedDate.getFullYear();
              const isCurrent =
                m === new Date().getMonth() + 1 &&
                pickerYear === new Date().getFullYear();
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    pickerSheet.monthCell,
                    isActive && pickerSheet.monthCellActive,
                    isCurrent && !isActive && pickerSheet.monthCellToday,
                  ]}
                  onPress={() => confirmMonth(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    pickerSheet.monthCellText,
                    isActive && pickerSheet.monthCellTextActive,
                    isCurrent && !isActive && { color: Colors.accent },
                  ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── YEARLY: year list ──────────────────────────────────────── */}
        {period === 'YEARLY' && (
          <FlatList
            data={years}
            keyExtractor={y => String(y)}
            style={pickerSheet.yearList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: y }) => {
              const isActive = y === selectedDate.getFullYear();
              const isCurrent = y === new Date().getFullYear();
              return (
                <TouchableOpacity
                  style={[
                    pickerSheet.yearRow,
                    isActive && pickerSheet.yearRowActive,
                  ]}
                  onPress={() => confirmYear(y)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    pickerSheet.yearRowText,
                    isActive && pickerSheet.yearRowTextActive,
                    isCurrent && !isActive && { color: Colors.accent },
                  ]}>
                    {y}
                  </Text>
                  {isCurrent && (
                    <Text style={pickerSheet.yearCurrentBadge}>Current</Text>
                  )}
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ── WEEKLY: week range list ────────────────────────────────── */}
        {period === 'WEEKLY' && (
          <FlatList
            data={weeks}
            keyExtractor={w => w.from}
            style={pickerSheet.yearList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: w, index }) => {
              const selBounds = weekBounds(
                `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
              );
              const isActive = w.from === selBounds.from;
              return (
                <TouchableOpacity
                  style={[
                    pickerSheet.weekRow,
                    isActive && pickerSheet.yearRowActive,
                  ]}
                  onPress={() => confirmWeek(w.from)}
                  activeOpacity={0.7}
                >
                  <View style={pickerSheet.weekRowLeft}>
                    <View style={[
                      pickerSheet.weekBadge,
                      isActive && { backgroundColor: 'rgba(255,255,255,0.25)' },
                    ]}>
                      <Text style={[
                        pickerSheet.weekBadgeText,
                        isActive && { color: '#fff' },
                      ]}>W{index + 1}</Text>
                    </View>
                    <Text style={[
                      pickerSheet.yearRowText,
                      isActive && pickerSheet.yearRowTextActive,
                    ]}>{w.label}</Text>
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </Animated.View>
    </Modal>
  );
}


// ─── Premium Bar Chart ─────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue: number;
}
function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue > 0 ? maxValue : 1;
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => {
        const heightPct = Math.min(100, (d.value / max) * 100);
        return (
          <View key={i} style={chartStyles.barCol}>
            {d.value > 0 && (
              <Text style={chartStyles.barValue} numberOfLines={1}>
                {d.value >= 1000 ? `${Math.round(d.value / 1000)}k` : d.value}
              </Text>
            )}
            <View style={chartStyles.barWrap}>
              <View
                style={[
                  chartStyles.bar,
                  { height: `${heightPct}%` as any },
                  heightPct === 100 && chartStyles.barTop,
                ]}
              />
            </View>
            <Text style={chartStyles.barLabel} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: verticalScale(110),
    gap: scale(4),
    paddingTop: verticalScale(16),
    paddingHorizontal: scale(4),
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(3),
  },
  barValue: {
    fontSize: moderateScale(7),
    color: Colors.accent,
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  barWrap: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(152,37,152,0.06)',
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: Colors.accent,
    borderRadius: moderateScale(4),
    opacity: 0.85,
  },
  barTop: {
    opacity: 1,
  },
  barLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(8),
    textAlign: 'center',
  },
});

// ─── Ledger row ────────────────────────────────────────────────────────────────
function LedgerRow({ item, idx }: { item: PaymentRecord; idx: number }) {
  const isPaid = item.status === 'PAID';
  return (
    <View style={[ledgerStyles.row, idx % 2 === 0 && ledgerStyles.rowAlt]}>
      <View style={ledgerStyles.left}>
        <View style={[ledgerStyles.typeIndicator, { backgroundColor: isPaid ? Colors.activeBg : Colors.expiredBg }]}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : 'time-outline'}
            size={12}
            color={isPaid ? Colors.activeText : Colors.expiredText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ledgerStyles.memberName} numberOfLines={1}>{item.memberName}</Text>
          <Text style={ledgerStyles.planName}>{item.planName ?? '—'}</Text>
          <Text style={ledgerStyles.date}>
            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {item.mode ? ` · ${item.mode}` : ''}
          </Text>
        </View>
      </View>
      <View style={ledgerStyles.right}>
        <Text style={[ledgerStyles.amount, !isPaid && { color: Colors.expiredRed }]}>
          {isPaid ? '+' : ''}{formatCurrency(item.amount)}
        </Text>
        <View style={[ledgerStyles.badge, { backgroundColor: isPaid ? Colors.activeBg : Colors.expiredBg }]}>
          <Text style={[ledgerStyles.badgeText, { color: isPaid ? Colors.activeText : Colors.expiredText }]}>
            {isPaid ? 'PAID' : 'DUE'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const ledgerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: 'rgba(21,23,61,0.015)',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
    marginRight: scale(12),
  },
  typeIndicator: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(2),
  },
  memberName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  planName: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
  right: { alignItems: 'flex-end', gap: verticalScale(4) },
  amount: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.activeGreen,
    fontSize: moderateScale(14),
  },
  badge: {
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(5),
  },
  badgeText: {
    fontWeight: '800',
    fontSize: moderateScale(9),
    letterSpacing: 0.3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RevenueScreen() {
  const [period, setPeriod] = useState<Period>('MONTHLY');
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [ledger, setLedger] = useState<PaymentRecord[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const year  = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const fetchStats = useCallback(async (p: Period, y: number, m: number, fullDateStr: string) => {
    try {
      setError(null);
      let data: RevenueStats;
      if (p === 'DAILY')        data = await revenueService.getDaily(fullDateStr);
      else if (p === 'WEEKLY')  data = await revenueService.getWeekly(fullDateStr);
      else if (p === 'MONTHLY') data = await revenueService.getMonthly(y, m);
      else                      data = await revenueService.getYearly(y);
      setStats(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load revenue');
    }
  }, []);

  const fetchLedger = useCallback(async (p: Period, y: number, m: number, fullDateStr: string) => {
    try {
      let from = '';
      let to = '';
      if (p === 'DAILY') {
        from = fullDateStr;
        to = fullDateStr;
      } else if (p === 'WEEKLY') {
        const bounds = weekBounds(fullDateStr);
        from = bounds.from;
        to = bounds.to;
      } else {
        const bounds = getLedgerRange(p, y, m);
        from = bounds.from;
        to = bounds.to;
      }
      const data = await paymentService.getLedger(from, to);
      setLedger(data);
    } catch {
      setLedger([]);
    }
  }, []);

  const load = useCallback(async (p: Period, targetDate: Date) => {
    setStatsLoading(true);
    setLedgerLoading(true);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    await Promise.all([fetchStats(p, y, m, dateStr), fetchLedger(p, y, m, dateStr)]);
    setStatsLoading(false);
    setLedgerLoading(false);
  }, [fetchStats, fetchLedger]);

  useEffect(() => { load(period, selectedDate); }, [period, selectedDate]);

  const handleDateConfirm = (date: Date) => {
    setShowDatePicker(false);
    setSelectedDate(date);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(period, selectedDate);
    setRefreshing(false);
  };

  const maxChart = stats?.chartData
    ? Math.max(...stats.chartData.map(d => d.value), 1)
    : 1;

  const collected = ledger.filter(r => r.status === 'PAID').reduce((s, r) => s + r.amount, 0);
  const pending   = ledger.filter(r => r.status === 'DUE').reduce((s, r) => s + r.amount, 0);
  const paidCount = ledger.filter(r => r.status === 'PAID').length;
  const dueCount  = ledger.filter(r => r.status === 'DUE').length;

  const periodLabel = (() => {
    switch (period) {
      case 'DAILY':   return selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      case 'WEEKLY':  return `Week of ${selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
      case 'MONTHLY': return selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      case 'YEARLY':  return String(selectedDate.getFullYear());
    }
  })();

  const chooserLabel = period === 'YEARLY' ? 'Year' : period === 'MONTHLY' ? 'Month' : 'Date';

  return (
    <View style={styles.root}>
      <AppHeader title="Revenue" subtitle={stats?.label ?? periodLabel} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* ── Period Tabs ────────────────────────────────────────────────── */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodTab, period === p.key && styles.periodTabActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={p.icon}
                size={14}
                color={period === p.key ? '#fff' : Colors.textMuted}
              />
              <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Date Selector Card ──────────────────────────────────────────── */}
        <View style={styles.dateSelectorCard}>
          <View style={styles.dateSelectorLeft}>
            <View style={styles.dateSelectorIconBox}>
              <Ionicons name="calendar" size={18} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.dateSelectorLabel}>Target Period</Text>
              <Text style={styles.dateSelectorValue}>{periodLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dateChooseBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down-circle-outline" size={14} color={Colors.accent} />
            <Text style={styles.dateChooseBtnText}>Choose {chooserLabel}</Text>
          </TouchableOpacity>
        </View>
        <PeriodPickerModal
          visible={showDatePicker}
          period={period}
          selectedDate={selectedDate}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />

        {statsLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading revenue data…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <View style={styles.errorIconBox}>
              <Ionicons name="alert-circle" size={32} color={Colors.expiredRed} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load(period, selectedDate)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Summary Cards ────────────────────────────────────────── */}
            <View style={styles.summaryRow}>
              {/* Collected */}
              <View style={[styles.summaryCard, { borderColor: Colors.accent }]}>
                <View style={styles.summaryCardHeader}>
                  <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(152,37,152,0.08)' }]}>
                    <Ionicons name="trending-up" size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.summaryLabel}>COLLECTED</Text>
                </View>
                <Text style={[styles.summaryAmount, { color: Colors.accent }]}>
                  {formatCurrency(collected)}
                </Text>
                <Text style={styles.summaryCount}>{paidCount} payment{paidCount !== 1 ? 's' : ''}</Text>
              </View>

              {/* Pending */}
              <View style={[styles.summaryCard, { borderColor: Colors.accent }]}>
                <View style={styles.summaryCardHeader}>
                  <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(152,37,152,0.08)' }]}>
                    <Ionicons name="time" size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.summaryLabel}>PENDING</Text>
                </View>
                <Text style={[styles.summaryAmount, { color: Colors.expiredRed }]}>
                  {formatCurrency(pending)}
                </Text>
                <Text style={styles.summaryCount}>{dueCount} due</Text>
              </View>
            </View>

            {/* Collection rate */}
            {(collected + pending) > 0 && (
              <View style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Text style={styles.rateLabel}>Collection Rate</Text>
                  <Text style={[styles.rateValue, {
                    color: collected / (collected + pending) >= 0.8 ? Colors.activeGreen : Colors.expiringAmber,
                  }]}>
                    {Math.round((collected / (collected + pending)) * 100)}%
                  </Text>
                </View>
                <View style={styles.rateBarBg}>
                  <View style={[styles.rateBarFill, {
                    width: `${Math.round((collected / (collected + pending)) * 100)}%` as any,
                    backgroundColor: collected / (collected + pending) >= 0.8 ? Colors.activeGreen : Colors.expiringAmber,
                  }]} />
                </View>
                <Text style={styles.rateSubtext}>
                  {formatCurrency(collected)} of {formatCurrency(collected + pending)} total
                </Text>
              </View>
            )}

            {/* ── Bar Chart ────────────────────────────────────────────── */}
            {stats?.chartData && stats.chartData.length > 0 && (
              <View style={styles.card}>
                <View style={styles.chartCardHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <Ionicons name="bar-chart" size={16} color={Colors.accent} />
                    <Text style={styles.cardTitle}>Revenue Chart</Text>
                  </View>
                  <Text style={styles.chartPeriodBadge}>{stats.label}</Text>
                </View>
                <View style={styles.chartBody}>
                  <BarChart data={stats.chartData} maxValue={maxChart} />
                </View>
              </View>
            )}

            {/* ── Ledger Table ──────────────────────────────────────────── */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.ledgerHeader}
                onPress={() => setShowLedger(l => !l)}
                activeOpacity={0.7}
              >
                <View style={styles.ledgerHeaderLeft}>
                  <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(152,37,152,0.08)' }]}>
                    <Ionicons name="receipt" size={14} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Payment Ledger</Text>
                    <Text style={styles.ledgerCount}>{ledger.length} total entries</Text>
                  </View>
                </View>
                <Ionicons
                  name={showLedger ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {showLedger && (
                ledgerLoading ? (
                  <View style={styles.ledgerLoading}>
                    <ActivityIndicator size="small" color={Colors.accent} />
                    <Text style={styles.loadingText}>Loading transactions…</Text>
                  </View>
                ) : ledger.length === 0 ? (
                  <View style={styles.ledgerEmpty}>
                    <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
                    <Text style={styles.ledgerEmptyText}>No transactions in this period</Text>
                  </View>
                ) : (
                  <>
                    {/* Column headers */}
                    <View style={styles.ledgerColHeader}>
                      <Text style={[styles.ledgerColText, { flex: 1 }]}>MEMBER / PLAN</Text>
                      <Text style={styles.ledgerColText}>AMOUNT</Text>
                    </View>
                    {ledger.map((item, idx) => (
                      <LedgerRow key={item.id} item={item} idx={idx} />
                    ))}
                    {/* Running total */}
                    <View style={styles.ledgerTotal}>
                      <View style={styles.ledgerTotalLeft}>
                        <Ionicons name="wallet" size={16} color={Colors.accent} />
                        <Text style={styles.ledgerTotalLabel}>Total Collected</Text>
                      </View>
                      <Text style={styles.ledgerTotalAmount}>{formatCurrency(collected)}</Text>
                    </View>
                  </>
                )
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    padding: scale(Layout.spacing.lg),
    gap: verticalScale(12),
    paddingBottom: verticalScale(120),
  },

  // Period tabs
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: scale(4),
    gap: scale(4),
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(4),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(8),
  },
  periodTabActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  periodTabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  periodTabTextActive: { color: '#fff', fontWeight: '700' },

  // Date selector
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: moderateScale(12),
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  dateSelectorIconBox: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(152,37,152,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorLabel: {
    fontSize: moderateScale(10),
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dateSelectorValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  dateChooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    backgroundColor: 'rgba(152,37,152,0.07)',
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderWidth: 1,
    borderColor: 'rgba(152,37,152,0.2)',
  },
  dateChooseBtnText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(11),
  },

  // Loading / Error
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(10),
    paddingVertical: verticalScale(50),
  },
  loadingText: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(13) },
  errorWrap: {
    alignItems: 'center',
    gap: verticalScale(10),
    paddingVertical: verticalScale(40),
  },
  errorIconBox: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { ...Typography.body, color: Colors.expiredRed, textAlign: 'center', fontSize: moderateScale(14) },
  retryBtn: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    backgroundColor: 'rgba(152,37,152,0.08)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: { ...Typography.caption, color: Colors.accent, fontWeight: '700', fontSize: moderateScale(13) },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: scale(10) },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 0.5,
    padding: moderateScale(14),
    gap: verticalScale(4),
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  summaryIconBox: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginTop: verticalScale(4),
  },
  summaryCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
  },

  // Collection rate
  rateCard: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: moderateScale(14),
    gap: verticalScale(8),
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  rateValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  rateBarBg: {
    height: verticalScale(6),
    backgroundColor: 'rgba(21,23,61,0.07)',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  rateBarFill: {
    height: '100%',
    borderRadius: moderateScale(3),
  },
  rateSubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Chart card
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: verticalScale(4),
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  cardTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  chartPeriodBadge: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(11),
    backgroundColor: 'rgba(152,37,152,0.08)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
  },
  chartBody: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(14),
  },

  // Ledger
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
  },
  ledgerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  ledgerCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
  ledgerColHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(7),
    backgroundColor: Colors.background,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.border,
  },
  ledgerColText: {
    ...Typography.label,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: moderateScale(9),
    letterSpacing: 0.5,
  },
  ledgerLoading: {
    padding: moderateScale(20),
    alignItems: 'center',
    gap: verticalScale(8),
  },
  ledgerEmpty: {
    padding: moderateScale(28),
    alignItems: 'center',
    gap: verticalScale(10),
  },
  ledgerEmptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(13),
  },
  ledgerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(152,37,152,0.05)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(152,37,152,0.25)',
  },
  ledgerTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  ledgerTotalLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  ledgerTotalAmount: {
    ...Typography.heading3,
    fontWeight: '800',
    color: Colors.accent,
    fontSize: moderateScale(17),
  },
});

// ─── Period Picker Sheet Styles ───────────────────────────────────────────────
const pickerSheet = StyleSheet.create({
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
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(48),
    paddingTop: verticalScale(12),
    gap: verticalScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: Colors.border,
    borderRadius: moderateScale(4),
    alignSelf: 'center',
    marginBottom: verticalScale(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  closeBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Year navigator bar
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(24),
    backgroundColor: Colors.background,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
  },
  yearArrow: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearLabel: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: moderateScale(20),
    minWidth: scale(60),
    textAlign: 'center',
  },
  monthLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: moderateScale(14),
    minWidth: scale(40),
    textAlign: 'center',
  },
  // Month grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  monthCell: {
    width: '22%',
    flexGrow: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monthCellActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  monthCellToday: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  monthCellText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  monthCellTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  // Year list
  yearList: {
    maxHeight: verticalScale(260),
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(13),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(4),
    backgroundColor: Colors.background,
  },
  yearRowActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  yearRowText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  yearRowTextActive: {
    color: '#fff',
  },
  yearCurrentBadge: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Colors.accent,
    backgroundColor: 'rgba(152,37,152,0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
  },
  // Week rows
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(5),
    backgroundColor: Colors.background,
  },
  weekRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  weekBadge: {
    backgroundColor: 'rgba(152,37,152,0.1)',
    borderRadius: moderateScale(6),
    paddingHorizontal: scale(7),
    paddingVertical: verticalScale(3),
  },
  weekBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.3,
  },
});