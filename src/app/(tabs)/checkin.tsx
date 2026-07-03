import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { attendanceService, AttendanceRecord, AttendanceSlot } from '@/services/attendanceService';
import { memberService } from '@/services/memberService';
import { Member } from '@/types/Members';
import AvatarCircle from '@/components/AvatarCircle';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// ─── Slot config ───────────────────────────────────────────────────────────────
const SLOT_CONFIG = {
  MORNING: {
    label: 'Morning Session',
    timeRange: '5:00 AM – 11:00 AM',
    icon: 'sunny-outline' as const,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
    activeGlow: 'rgba(245,158,11,0.15)',
  },
  EVENING: {
    label: 'Evening Session',
    timeRange: '5:00 PM – 9:00 PM',
    icon: 'moon-outline' as const,
    color: '#6366F1',
    bgColor: 'rgba(99,102,241,0.08)',
    borderColor: 'rgba(99,102,241,0.25)',
    activeGlow: 'rgba(99,102,241,0.15)',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function displayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function currentSlot(): AttendanceSlot {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'MORNING';
  if (h >= 17 && h < 21) return 'EVENING';
  return 'OTHER';
}

// ─── Member Row inside slot panel ─────────────────────────────────────────────
interface MemberRowProps {
  member: Member;
  record: AttendanceRecord | undefined;
  onCheckIn: (memberId: number) => void;
  checkingIn: boolean;
}

function MemberRow({ member, record, onCheckIn, checkingIn }: MemberRowProps) {
  const checkedIn = !!record?.visited;
  return (
    <View style={rowStyles.container}>
      <AvatarCircle name={member.name} id={String(member.id)} size={38} />
      <View style={rowStyles.info}>
        <View style={rowStyles.nameRow}>
          <Text style={rowStyles.name}>{member.name}</Text>
          {member.isPtMember && (
            <View style={rowStyles.ptBadge}>
              <Text style={rowStyles.ptBadgeText}>PT</Text>
            </View>
          )}
        </View>
        <Text style={rowStyles.phone}>{member.phone}</Text>
        {record?.checkInTime && (
          <View style={rowStyles.checkInTimeRow}>
            <Ionicons name="checkmark-circle" size={10} color={Colors.activeGreen} />
            <Text style={rowStyles.checkInTime}>
              Checked in at {record.checkInTime.slice(0, 5)}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[rowStyles.checkInBtn, checkedIn && rowStyles.checkInBtnDone]}
        onPress={() => onCheckIn(member.id)}
        disabled={checkingIn || checkedIn}
        activeOpacity={0.7}
      >
        {checkingIn ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : checkedIn ? (
          <>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={rowStyles.checkInBtnText}>Done</Text>
          </>
        ) : (
          <>
            <Ionicons name="scan-outline" size={14} color="#fff" />
            <Text style={rowStyles.checkInBtnText}>Check In</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  name: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  ptBadge: {
    backgroundColor: '#C6860A',
    paddingHorizontal: scale(5),
    paddingVertical: 1,
    borderRadius: moderateScale(4),
  },
  ptBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: moderateScale(7),
    letterSpacing: 0.3,
  },
  phone: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  checkInTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    marginTop: verticalScale(2),
  },
  checkInTime: {
    ...Typography.caption,
    color: Colors.activeGreen,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: Colors.accent,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(10),
    minWidth: scale(82),
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  checkInBtnDone: {
    backgroundColor: Colors.activeGreen,
    shadowColor: Colors.activeGreen,
  },
  checkInBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(11),
  },
});

// ─── Slot Panel ───────────────────────────────────────────────────────────────
interface SlotPanelProps {
  slot: 'MORNING' | 'EVENING';
  members: Member[];
  records: AttendanceRecord[];
  isToday: boolean;
  checkingInId: number | null;
  onCheckIn: (memberId: number) => void;
  activeSlot: AttendanceSlot | null;
}

function SlotPanel({ slot, members, records, isToday, checkingInId, onCheckIn, activeSlot }: SlotPanelProps) {
  const cfg = SLOT_CONFIG[slot];
  const [expanded, setExpanded] = useState(true);
  const isActive = isToday && activeSlot === slot;

  const checkedInIds = new Set(records.filter(r => r.slot === slot && r.visited).map(r => r.memberId));
  const totalChecked = checkedInIds.size;

  const sortedMembers = [...members].sort((a, b) => {
    const aChecked = checkedInIds.has(a.id);
    const bChecked = checkedInIds.has(b.id);
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const pct = members.length > 0 ? Math.round((totalChecked / members.length) * 100) : 0;

  return (
    <View style={[panelStyles.container, { borderColor: isActive ? cfg.color : cfg.borderColor }]}>
      {isActive && <View style={[panelStyles.activeGlowStrip, { backgroundColor: cfg.activeGlow }]} />}

      {/* Header */}
      <TouchableOpacity
        style={[panelStyles.header, { backgroundColor: cfg.bgColor }]}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
      >
        <View style={panelStyles.headerLeft}>
          <View style={[panelStyles.slotIconBox, { backgroundColor: `${cfg.color}18` }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
              <Text style={[panelStyles.slotLabel, { color: cfg.color }]}>{cfg.label}</Text>
              {isActive && (
                <View style={[panelStyles.liveDot, { backgroundColor: cfg.color }]} />
              )}
            </View>
            <Text style={panelStyles.slotTime}>{cfg.timeRange}</Text>
          </View>
        </View>
        <View style={panelStyles.headerRight}>
          <View style={panelStyles.progressArea}>
            <Text style={[panelStyles.countText, { color: cfg.color }]}>{totalChecked}/{members.length}</Text>
            <View style={panelStyles.progressBg}>
              <View style={[panelStyles.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* Member List */}
      {expanded && (
        sortedMembers.length === 0 ? (
          <View style={panelStyles.empty}>
            <Ionicons name="people-outline" size={20} color={Colors.textMuted} />
            <Text style={panelStyles.emptyText}>No active members</Text>
          </View>
        ) : (
          sortedMembers.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              record={records.find(r => r.memberId === member.id && r.slot === slot)}
              onCheckIn={onCheckIn}
              checkingIn={checkingInId === member.id}
            />
          ))
        )
      )}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: verticalScale(14),
    backgroundColor: Colors.surface,
  },
  activeGlowStrip: {
    height: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  slotIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    opacity: 0.85,
  },
  slotTime: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  progressArea: {
    alignItems: 'flex-end',
    gap: verticalScale(3),
  },
  countText: {
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  progressBg: {
    width: scale(60),
    height: verticalScale(4),
    backgroundColor: 'rgba(21,23,61,0.08)',
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  empty: {
    padding: moderateScale(20),
    alignItems: 'center',
    gap: verticalScale(6),
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
});

// ─── Main CheckIn Screen ───────────────────────────────────────────────────────
export default function CheckInScreen() {
  const today = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateInput, setDateInput] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isToday = selectedDate === today;
  const activeSlot = isToday ? currentSlot() : null;

  const handleDatePickerConfirm = (date: Date) => {
    setShowDatePicker(false);
    const ymd = toYMD(date);
    setDateInput(ymd);
    setSelectedDate(ymd);
  };

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async (date: string) => {
    try {
      setError(null);
      const [recs, mems] = await Promise.all([
        attendanceService.getByDate(date),
        memberService.getAll(),
      ]);
      setRecords(recs);
      if (date === today) {
        setMembers(mems.filter(m => m.status === 'ACTIVE' || m.status === 'EXPIRING'));
      } else {
        setMembers(mems);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load attendance');
    }
  }, [today]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData(selectedDate);
      setLoading(false);
    })();
  }, [selectedDate, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(selectedDate);
    setRefreshing(false);
  }, [selectedDate, loadData]);

  const handleCheckIn = async (memberId: number) => {
    setCheckingInId(memberId);
    try {
      const newRecord = await attendanceService.checkIn(memberId);
      setRecords(prev => {
        const idx = prev.findIndex(r => r.memberId === memberId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newRecord;
          return updated;
        }
        return [...prev, newRecord];
      });
    } catch (e: any) {
      Alert.alert('Check-In Failed', e?.message ?? 'Unable to record check-in');
    } finally {
      setCheckingInId(null);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const morningCount  = records.filter(r => r.slot === 'MORNING' && r.visited).length;
  const eveningCount  = records.filter(r => r.slot === 'EVENING' && r.visited).length;
  const totalCheckedIn = new Set(records.filter(r => r.visited).map(r => r.memberId)).size;

  return (
    <View style={styles.root}>
      <AppHeader title="Check In" subtitle={isToday ? "Today's Attendance" : displayDate(selectedDate)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* ── Date Picker ────────────────────────────────────────────────── */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateTouchable}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconBox}>
              <Ionicons name="calendar" size={16} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.dateLabelSmall}>Viewing Date</Text>
              <Text style={styles.dateValue}>{displayDate(selectedDate)}</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {!isToday && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => { setDateInput(today); setSelectedDate(today); }}
              activeOpacity={0.8}
            >
              <Ionicons name="today-outline" size={14} color={Colors.accent} />
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={new Date(selectedDate + 'T12:00:00')}
          onConfirm={handleDatePickerConfirm}
          onCancel={() => setShowDatePicker(false)}
          accentColor={Colors.accent}
        />

        {/* ── Stats Cards ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(21,23,61,0.08)' }]}>
              <Ionicons name="people" size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{totalCheckedIn}</Text>
            <Text style={styles.statLabel}>Total In</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <Ionicons name="sunny" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{morningCount}</Text>
            <Text style={styles.statLabel}>Morning</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
              <Ionicons name="moon" size={18} color="#6366F1" />
            </View>
            <Text style={[styles.statValue, { color: '#6366F1' }]}>{eveningCount}</Text>
            <Text style={styles.statLabel}>Evening</Text>
          </View>
        </View>

        {/* Current slot indicator (today only) */}
        {isToday && activeSlot !== 'OTHER' && (
          <View style={[styles.activeSlotBanner, {
            backgroundColor: activeSlot === 'MORNING' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
            borderColor: activeSlot === 'MORNING' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)',
          }]}>
            <View style={[styles.pulseIndicator, {
              backgroundColor: activeSlot === 'MORNING' ? '#F59E0B' : '#6366F1',
            }]} />
            <Text style={[styles.activeSlotText, {
              color: activeSlot === 'MORNING' ? '#D97706' : '#4F46E5',
            }]}>
              {activeSlot === 'MORNING' ? '🌅 Morning session active (5–11 AM)' : '🌙 Evening session active (5–9 PM)'}
            </Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Loading attendance…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(239,68,68,0.1)', width: 56, height: 56, borderRadius: 28 }]}>
              <Ionicons name="alert-circle" size={28} color={Colors.expiredRed} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryText}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Morning slot */}
            <SlotPanel
              slot="MORNING"
              members={filteredMembers}
              records={records}
              isToday={isToday}
              checkingInId={checkingInId}
              onCheckIn={handleCheckIn}
              activeSlot={activeSlot}
            />

            {/* Evening slot */}
            <SlotPanel
              slot="EVENING"
              members={filteredMembers}
              records={records}
              isToday={isToday}
              checkingInId={checkingInId}
              onCheckIn={handleCheckIn}
              activeSlot={activeSlot}
            />

            {/* Out-of-slot records */}
            {records.filter(r => r.slot === 'OTHER' && r.visited).length > 0 && (
              <View style={styles.otherRecords}>
                <View style={styles.otherHeader}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.otherTitle}>Other Check-ins</Text>
                </View>
                {records.filter(r => r.slot === 'OTHER').map(r => (
                  <View key={r.id} style={styles.otherRow}>
                    <Text style={styles.otherName}>{r.memberName}</Text>
                    <Text style={styles.otherTime}>{r.checkInTime?.slice(0, 5) ?? '—'}</Text>
                  </View>
                ))}
              </View>
            )}
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
    paddingBottom: verticalScale(120),
    gap: verticalScale(12),
  },

  // Date picker row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  dateTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  dateIconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(152,37,152,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabelSmall: {
    fontSize: moderateScale(10),
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dateValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(152,37,152,0.06)',
  },
  todayBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(12),
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: moderateScale(12),
    alignItems: 'center',
    gap: verticalScale(4),
  },
  statIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: moderateScale(22),
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    textAlign: 'center',
  },

  // Active slot banner
  activeSlotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeSlotText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: scale(12),
    height: verticalScale(44),
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },

  // Loading / Error
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
    paddingVertical: verticalScale(50),
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(13),
  },
  errorWrap: {
    alignItems: 'center',
    gap: verticalScale(10),
    paddingVertical: verticalScale(40),
  },
  errorText: {
    ...Typography.body,
    color: Colors.expiredRed,
    textAlign: 'center',
    fontSize: moderateScale(14),
  },
  retryBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(152,37,152,0.08)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },

  // Other records
  otherRecords: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  otherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    padding: moderateScale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  otherTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: moderateScale(11),
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  otherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  otherName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  otherTime: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
});
