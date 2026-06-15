import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, ActivityIndicator,
  Modal, TextInput, Alert as RNAlert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '@/store/memberStore';
import { usePlanStore } from '@/store/planStore';
import { paymentService } from '@/services/paymentService';
import { Colors, Typography, Layout } from '@/constants/theme';
import { formatCurrency, formatDate, getStatusColors } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import AvatarCircle from '@/components/AvatarCircle';
import StatusBadge from '@/components/StatusBadge';
import PlanProgressBar from '@/components/PlanProgressBar';
import AttendanceBar from '@/components/AttendanceBar';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

// ─── Renew Modal ──────────────────────────────────────────────────────────────
interface RenewModalProps {
  visible: boolean;
  plans: any[];
  currentPlanId?: number;
  onClose: () => void;
  onConfirm: (planId: number, startDate: string, paymentStatus: 'PAID' | 'DUE', paymentMode: string) => void;
  loading: boolean;
}

function RenewModal({ visible, plans, currentPlanId, onClose, onConfirm, loading }: RenewModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(currentPlanId ?? plans[0]?.id ?? 0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [payStatus, setPayStatus] = useState<'PAID' | 'DUE'>('PAID');
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');

  useEffect(() => {
    if (visible) {
      setSelectedPlanId(currentPlanId ?? plans[0]?.id ?? 0);
      setStartDate(new Date().toISOString().slice(0, 10));
      setPayStatus('PAID');
      setPayMode('CASH');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={rm.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={rm.sheet}>
          <View style={rm.header}>
            <Text style={rm.title}>Renew Plan</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Plan picker */}
            <Text style={rm.label}>Select Plan</Text>
            <View style={rm.planGrid}>
              {plans.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[rm.planChip, selectedPlanId === p.id && rm.planChipActive]}
                  onPress={() => setSelectedPlanId(p.id)}
                >
                  <Text style={[rm.planChipName, selectedPlanId === p.id && rm.planChipNameActive]}>
                    {p.name}
                  </Text>
                  <Text style={[rm.planChipPrice, selectedPlanId === p.id && { color: '#fff' }]}>
                    ₹{p.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start date */}
            <Text style={rm.label}>Start Date</Text>
            <TextInput
              style={rm.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Payment status */}
            <Text style={rm.label}>Payment</Text>
            <View style={rm.row}>
              {(['PAID', 'DUE'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[rm.statusBtn, payStatus === s && (s === 'PAID' ? rm.statusPaid : rm.statusDue)]}
                  onPress={() => setPayStatus(s)}
                >
                  <Ionicons
                    name={s === 'PAID' ? 'checkmark-circle-outline' : 'time-outline'}
                    size={16}
                    color={payStatus === s ? '#fff' : Colors.textMuted}
                  />
                  <Text style={[rm.statusText, payStatus === s && { color: '#fff' }]}>
                    {s === 'PAID' ? 'Paid' : 'Due'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mode - only when PAID */}
            {payStatus === 'PAID' && (
              <>
                <Text style={rm.label}>Payment Mode</Text>
                <View style={rm.row}>
                  {(['CASH', 'UPI', 'CARD'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[rm.modeChip, payMode === m && rm.modeChipActive]}
                      onPress={() => setPayMode(m)}
                    >
                      <Text style={[rm.modeText, payMode === m && rm.modeTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Actions */}
            <View style={rm.actions}>
              <TouchableOpacity style={rm.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={rm.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[rm.confirmBtn, loading && { opacity: 0.6 }]}
                onPress={() => onConfirm(selectedPlanId, startDate, payStatus, payMode)}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={rm.confirmText}>Renew</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: scale(20),
    paddingBottom: verticalScale(36),
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(16) },
  title: { ...Typography.heading3, color: Colors.textPrimary, fontSize: moderateScale(16) },
  label: { ...Typography.label, color: Colors.textMuted, fontSize: moderateScale(11), marginTop: verticalScale(14), marginBottom: verticalScale(6) },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: moderateScale(8),
    paddingHorizontal: scale(12), paddingVertical: verticalScale(10),
    color: Colors.textPrimary, fontSize: moderateScale(14), backgroundColor: Colors.background,
  },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  planChip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: moderateScale(8),
    padding: moderateScale(10), backgroundColor: Colors.background, minWidth: scale(100),
  },
  planChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  planChipName: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600', fontSize: moderateScale(12) },
  planChipNameActive: { color: '#fff' },
  planChipPrice: { ...Typography.label, color: Colors.textMuted, marginTop: verticalScale(2), fontSize: moderateScale(11) },
  row: { flexDirection: 'row', gap: scale(8) },
  statusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6),
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: moderateScale(8), height: verticalScale(42),
  },
  statusPaid: { backgroundColor: Colors.activeGreen, borderColor: Colors.activeGreen },
  statusDue: { backgroundColor: Colors.expiredRed, borderColor: Colors.expiredRed },
  statusText: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary, fontSize: moderateScale(13) },
  modeChip: {
    flex: 1, alignItems: 'center', paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8), borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  modeChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  modeText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '500', fontSize: moderateScale(12) },
  modeTextActive: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: scale(10), marginTop: verticalScale(20) },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8), borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { ...Typography.body, color: Colors.textMuted, fontWeight: '600', fontSize: moderateScale(14) },
  confirmBtn: {
    flex: 2, alignItems: 'center', paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8), backgroundColor: Colors.accent,
  },
  confirmText: { ...Typography.body, color: '#fff', fontWeight: '700', fontSize: moderateScale(14) },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedMember: member,
    isLoading,
    error,
    fetchMemberById,
    checkIn,
    updateMember,
    renewMember,
    clearSelected,
  } = useMemberStore();
  const { plans, fetchPlans } = usePlanStore();

  const [payments, setPayments]             = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [checkingIn, setCheckingIn]         = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);
  const [renewVisible, setRenewVisible]     = useState(false);
  const [renewLoading, setRenewLoading]     = useState(false);
  const [markingPaidId, setMarkingPaidId]   = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchMemberById(Number(id));
      loadPayments(Number(id));
      fetchPlans();
    }
    return () => clearSelected();
  }, [id]);

  const loadPayments = async (memberId: number) => {
    setPaymentsLoading(true);
    try {
      const data = await paymentService.getByMember(memberId);
      setPayments(data);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!member) return;
    setCheckingIn(true);
    await checkIn(Number(id));
    setCheckingIn(false);
  };

  const handlePause = async () => {
    if (!member) return;
    setActionLoading(true);
    await updateMember(Number(id), { status: 'PAUSED' });
    setActionLoading(false);
  };

  const handleResume = async () => {
    if (!member) return;
    setActionLoading(true);
    await updateMember(Number(id), { status: 'ACTIVE' });
    setActionLoading(false);
  };

  // ── Mark a DUE payment as PAID ────────────────────────────────────────────
  const handleMarkPaid = async (paymentId: number) => {
    RNAlert.alert(
      'Mark as Paid',
      'Confirm that this payment has been collected?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            setMarkingPaidId(paymentId);
            try {
              const updated = await paymentService.markAsPaid(paymentId);
              setPayments(prev => prev.map(p => p.id === paymentId ? updated : p));
            } catch (e: any) {
              RNAlert.alert('Error', e?.message ?? 'Failed to mark payment');
            } finally {
              setMarkingPaidId(null);
            }
          },
        },
      ]
    );
  };

  // ── Renew plan ────────────────────────────────────────────────────────────
  const handleRenewConfirm = async (
    planId: number,
    startDate: string,
    paymentStatus: 'PAID' | 'DUE',
    paymentMode: string
  ) => {
    if (!member) return;
    setRenewLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      await renewMember(Number(id), {
        planId,
        planStartDate: startDate,
        paymentAmount: selectedPlan?.price ?? 0,
        paymentStatus,
        paymentMode: paymentStatus === 'PAID' ? paymentMode : undefined,
        // required fields the backend needs even for renewal
        name: member.name,
        phone: member.phone,
      });
      setRenewVisible(false);
      // Reload payments to show the new one
      await loadPayments(Number(id));
    } catch (e: any) {
      RNAlert.alert('Error', e?.message ?? 'Failed to renew plan');
    } finally {
      setRenewLoading(false);
    }
  };

  const handlePhoneCall = () =>
    Linking.openURL(`tel:${member?.phone}`).catch(() => {});

  const handleEmail = () => {
    if (member?.email) Linking.openURL(`mailto:${member.email}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    if (!member) return;
    const phone = member.phone.startsWith('+91') ? member.phone : `+91${member.phone}`;
    Linking.openURL(
      `whatsapp://send?phone=${phone}&text=Hi ${member.name}, this is Power House Fitness Studio.`
    ).catch(() => Linking.openURL(`sms:${member.phone}`).catch(() => {}));
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.root}>
        <AppHeader title="Member Profile" showBack onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading member…</Text>
        </View>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.root}>
        <AppHeader title="Member Profile" showBack onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.expiredRed} />
          <Text style={styles.errorText}>{error || 'Member not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isExpiredOrExpiring = member.status === 'EXPIRED' || member.status === 'EXPIRING';

  return (
    <View style={styles.root}>
      <AppHeader title="Member Profile" showBack onBack={() => router.back()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarCircle name={member.name} id={String(member.id)} size={scale(70)} />
            <View style={styles.profileTitleWrap}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberId}>ID: #PH-{String(member.id).padStart(4, '0')}</Text>
              <StatusBadge status={member.status} />
            </View>
          </View>

          {/* Quick Contact */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={handlePhoneCall}>
              <Ionicons name="call" size={moderateScale(18)} color={Colors.accent} />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, !member.email && styles.btnDisabled]}
              onPress={handleEmail}
              disabled={!member.email}
            >
              <Ionicons name="mail" size={moderateScale(18)} color={member.email ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.contactBtnText, !member.email && { color: Colors.textMuted }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={moderateScale(18)} color="#25D366" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { borderColor: Colors.accent }]}
              onPress={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn
                ? <ActivityIndicator size="small" color={Colors.accent} />
                : <Ionicons name="scan-outline" size={moderateScale(18)} color={Colors.accent} />
              }
              <Text style={styles.contactBtnText}>Check In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Subscription Card ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Active Subscription</Text>
            <View style={[styles.planTypeBadge, { backgroundColor: Colors.activeBg }]}>
              <Text style={[styles.planTypeText, { color: Colors.activeText }]}>
                {member.planType?.toUpperCase() ?? '—'}
              </Text>
            </View>
          </View>
          <View style={styles.planDetails}>
            <View style={styles.planInfoRow}>
              <Text style={styles.planLabel}>Plan Name</Text>
              <Text style={styles.planValue}>{member.planName ?? '—'}</Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text style={styles.planLabel}>Duration</Text>
              <Text style={styles.planValue}>
                {formatDate(member.planStartDate)} → {formatDate(member.planEndDate)}
              </Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text style={styles.planLabel}>Days Remaining</Text>
              <Text style={[styles.planValue, { color: Colors.accent }]}>
                {member.daysRemaining ?? 0} days
              </Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <PlanProgressBar
              startDate={member.planStartDate}
              endDate={member.planEndDate}
              status={member.status}
            />
          </View>

          {/* Renew button for Expired / Expiring members */}
          {isExpiredOrExpiring && (
            <TouchableOpacity
              style={styles.renewBtn}
              onPress={() => setRenewVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-circle-outline" size={moderateScale(18)} color="#fff" />
              <Text style={styles.renewBtnText}>
                {member.status === 'EXPIRED' ? 'Renew Plan' : 'Renew Early'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Attendance Card ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Attendance (Past 7 Days)</Text>
            <View style={styles.visitsBadge}>
              <Text style={styles.visitsText}>{member.totalVisitsThisMonth} visits this month</Text>
            </View>
          </View>
          <View style={styles.attendanceWrap}>
            <AttendanceBar attendance={member.attendance ?? []} />
          </View>
          {member.lastCheckIn && (
            <Text style={styles.lastCheckInText}>Last check-in: {formatDate(member.lastCheckIn)}</Text>
          )}
        </View>

        {/* ── Personal Details ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <View style={styles.detailsList}>
            {[
              { icon: 'call-outline',          label: 'Phone',    value: member.phone },
              { icon: 'mail-outline',          label: 'Email',    value: member.email },
              { icon: 'person-circle-outline', label: 'Trainer',  value: member.assignedTrainer },
              { icon: 'calendar-outline',      label: 'Joined',   value: member.joinDate ? formatDate(member.joinDate) : null },
              { icon: 'gift-outline',          label: 'Birthday', value: member.dateOfBirth ? formatDate(member.dateOfBirth) : null },
              { icon: 'location-outline',      label: 'Address',  value: member.address },
            ]
              .filter(row => row.value)
              .map(row => (
                <View key={row.label} style={styles.detailRow}>
                  <Ionicons name={row.icon as any} size={moderateScale(18)} color={Colors.accent} />
                  <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* ── Payment History ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment History</Text>
          <View style={styles.paymentList}>
            {paymentsLoading ? (
              <ActivityIndicator color={Colors.accent} />
            ) : payments.length > 0 ? (
              payments.map(p => (
                <View key={p.id} style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentPlan}>{p.planName}</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(p.date)}{p.mode ? ` · ${p.mode}` : ''}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                    <View style={styles.paymentBadgeRow}>
                      <View style={[
                        styles.paymentBadge,
                        { backgroundColor: p.status === 'PAID' ? Colors.activeBg : Colors.expiredBg },
                      ]}>
                        <Text style={[
                          styles.paymentBadgeText,
                          { color: p.status === 'PAID' ? Colors.activeText : Colors.expiredText },
                        ]}>
                          {p.status === 'PAID' ? 'Paid' : 'Due'}
                        </Text>
                      </View>
                      {/* Mark as Paid button for DUE payments */}
                      {p.status === 'DUE' && (
                        <TouchableOpacity
                          style={styles.markPaidBtn}
                          onPress={() => handleMarkPaid(p.id)}
                          disabled={markingPaidId === p.id}
                        >
                          {markingPaidId === p.id
                            ? <ActivityIndicator size="small" color={Colors.activeGreen} />
                            : <Text style={styles.markPaidText}>Mark Paid</Text>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noPaymentsText}>No payments recorded.</Text>
            )}
          </View>
        </View>

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.accent }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(members)/memberForm', params: { id: String(member.id) } })}
          >
            <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {actionLoading ? (
            <View style={[styles.actionButton, { backgroundColor: Colors.pausedBg, justifyContent: 'center' }]}>
              <ActivityIndicator color={Colors.pausedGray} />
            </View>
          ) : member.status === 'PAUSED' ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.activeText }]}
              activeOpacity={0.8}
              onPress={handleResume}
            >
              <Ionicons name="play-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.actionButtonText}>Resume</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.pausedText }]}
              activeOpacity={0.8}
              onPress={handlePause}
            >
              <Ionicons name="pause-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.actionButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Renew Plan Modal ──────────────────────────────────────────────── */}
      <RenewModal
        visible={renewVisible}
        plans={plans}
        currentPlanId={plans.find(p => p.name === member.planName)?.id}
        onClose={() => setRenewVisible(false)}
        onConfirm={handleRenewConfirm}
        loading={renewLoading}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: scale(Layout.spacing.lg), gap: verticalScale(14), paddingBottom: verticalScale(40) },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: verticalScale(16), padding: scale(32) },
  loadingText: { ...Typography.caption, color: Colors.textMuted },
  errorText: { ...Typography.heading2, color: Colors.textPrimary, textAlign: 'center', fontSize: moderateScale(20) },
  backBtn: { backgroundColor: Colors.accent, paddingHorizontal: scale(20), paddingVertical: verticalScale(10), borderRadius: moderateScale(Layout.radius.md) },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(14) },
  profileCard: { backgroundColor: Colors.surface, borderRadius: moderateScale(Layout.radius.md), borderWidth: 0.5, borderColor: Colors.border, padding: moderateScale(16), gap: verticalScale(16) },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(14) },
  profileTitleWrap: { flex: 1, gap: verticalScale(3) },
  memberName: { ...Typography.heading2, color: Colors.textPrimary, fontSize: moderateScale(20) },
  memberId: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(12) },
  contactRow: { flexDirection: 'row', gap: scale(8), borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: verticalScale(14) },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(4), backgroundColor: Colors.background, borderWidth: 0.5, borderColor: Colors.border, paddingVertical: verticalScale(8), borderRadius: moderateScale(Layout.radius.sm) },
  contactBtnText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600', fontSize: moderateScale(11) },
  btnDisabled: { opacity: 0.5 },
  card: { backgroundColor: Colors.surface, borderRadius: moderateScale(Layout.radius.md), borderWidth: 0.5, borderColor: Colors.border, padding: moderateScale(16), gap: verticalScale(14) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...Typography.heading3, color: Colors.textPrimary, fontSize: moderateScale(15) },
  planTypeBadge: { paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: moderateScale(4) },
  planTypeText: { fontSize: moderateScale(10), fontWeight: '700' },
  planDetails: { gap: verticalScale(8) },
  planInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(12) },
  planValue: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary, fontSize: moderateScale(13) },
  progressSection: { borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: verticalScale(12) },
  renewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6), backgroundColor: Colors.accent, paddingVertical: verticalScale(10), borderRadius: moderateScale(Layout.radius.sm) },
  renewBtnText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(13) },
  visitsBadge: { backgroundColor: 'rgba(152,37,152,0.1)', paddingHorizontal: scale(8), paddingVertical: verticalScale(3), borderRadius: moderateScale(Layout.radius.full) },
  visitsText: { ...Typography.caption, color: Colors.accent, fontWeight: '600', fontSize: moderateScale(11) },
  attendanceWrap: { paddingVertical: verticalScale(4) },
  lastCheckInText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', fontSize: moderateScale(11) },
  detailsList: { gap: verticalScale(12) },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  detailTextWrap: { flex: 1, gap: verticalScale(1) },
  detailLabel: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(11) },
  detailValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600', fontSize: moderateScale(13) },
  paymentList: { gap: verticalScale(10) },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8), borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  paymentLeft: { gap: verticalScale(2) },
  paymentPlan: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary, fontSize: moderateScale(13) },
  paymentDate: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(11) },
  paymentRight: { alignItems: 'flex-end', gap: verticalScale(4) },
  paymentAmount: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary, fontSize: moderateScale(13) },
  paymentBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  paymentBadge: { paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: moderateScale(Layout.radius.full) },
  paymentBadgeText: { ...Typography.label, fontWeight: '700', fontSize: moderateScale(9) },
  markPaidBtn: { borderWidth: 1, borderColor: Colors.activeGreen, borderRadius: moderateScale(Layout.radius.full), paddingHorizontal: scale(8), paddingVertical: verticalScale(2) },
  markPaidText: { ...Typography.label, color: Colors.activeGreen, fontWeight: '700', fontSize: moderateScale(9) },
  noPaymentsText: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(12), textAlign: 'center' },
  actionSection: { flexDirection: 'row', gap: scale(10), marginTop: verticalScale(6) },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8), paddingVertical: verticalScale(12), borderRadius: moderateScale(Layout.radius.md) },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(13) },
});