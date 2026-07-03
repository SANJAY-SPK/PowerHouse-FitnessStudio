import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import { formatCurrency } from '@/utils/helper';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import { useAuthStore } from '@/store/authStore';
import { planService, Plan, PlanPayload } from '@/services/planService';

// ─── Plan type options ────────────────────────────────────────────────────────
const PLAN_TYPES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'LIFETIME'] as const;
type PlanType = typeof PLAN_TYPES[number];

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  YEARLY: 'Yearly',
  LIFETIME: 'Lifetime',
};

// ─── Blank form state ─────────────────────────────────────────────────────────
const BLANK_FORM: PlanPayload = {
  name: '',
  type: 'MONTHLY',
  durationDays: 30,
  price: 0,
  features: '',
};

export default function SettingsScreen() {
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [inactiveAlerts, setInactiveAlerts] = useState(true);
  const [leadTime, setLeadTime] = useState<7 | 3 | 1>(7);
  const { logout } = useAuthStore();

  // ─── Plans state ────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // ─── Modal state ────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null); // null = create mode
  const [form, setForm] = useState<PlanPayload>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Fetch plans ─────────────────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    try {
      setPlansError(null);
      const data = await planService.getAll();
      setPlans(data);
    } catch (e: any) {
      setPlansError(e?.message ?? 'Failed to load plans');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setPlansLoading(true);
      await fetchPlans();
      setPlansLoading(false);
    })();
  }, [fetchPlans]);

  // ─── Modal helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPlan(null);
    setForm(BLANK_FORM);
    setFormError(null);
    setModalVisible(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      type: plan.type,
      durationDays: plan.durationDays,
      price: plan.price,
      features: plan.features ?? '',
    });
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) { setFormError('Plan name is required'); return false; }
    if (form.durationDays <= 0) { setFormError('Duration must be > 0 days'); return false; }
    if (form.price < 0) { setFormError('Price cannot be negative'); return false; }
    setFormError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingPlan) {
        const updated = await planService.update(editingPlan.id, form);
        setPlans(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      } else {
        const created = await planService.create(form);
        setPlans(prev => [...prev, created]);
      }
      setModalVisible(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (plan: Plan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await planService.remove(plan.id);
              setPlans(prev => prev.filter(p => p.id !== plan.id));
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────
  const SectionHeader = ({ label }: { label: string }) => (
    <Text style={styles.sectionHeader}>{label}</Text>
  );

  const RowItem = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={Colors.softPink} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Gym Info ─────────────────────────────────────────────────────── */}
        <SectionHeader label="GYM INFORMATION" />
        <View style={styles.card}>
          <RowItem icon="business-outline" label="Gym Name" value="Power House FS" onPress={() => {}} />
          <View style={styles.divider} />
          <RowItem icon="person-outline" label="Owner" value="Admin" onPress={() => {}} />
          <View style={styles.divider} />
          <RowItem icon="call-outline" label="Phone" value="+91 99000 00001" onPress={() => {}} />
          <View style={styles.divider} />
          <RowItem icon="location-outline" label="Address" value="Tiruppur, TN" onPress={() => {}} />
        </View>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <SectionHeader label="NOTIFICATIONS" />
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Expiry Alerts</Text>
            </View>
            <Switch
              value={expiryAlerts}
              onValueChange={setExpiryAlerts}
              trackColor={{ true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="wallet-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Payment Alerts</Text>
            </View>
            <Switch
              value={paymentAlerts}
              onValueChange={setPaymentAlerts}
              trackColor={{ true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-remove-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Inactive Member Alerts</Text>
            </View>
            <Switch
              value={inactiveAlerts}
              onValueChange={setInactiveAlerts}
              trackColor={{ true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.leadTimeWrap}>
            <Text style={styles.rowLabel}>Alert Lead Time</Text>
            <View style={styles.segmentRow}>
              {([7, 3, 1] as const).map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.segment, leadTime === d && styles.segmentActive]}
                  onPress={() => setLeadTime(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, leadTime === d && styles.segmentTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Plan Manager ─────────────────────────────────────────────────── */}
        <SectionHeader label="PLAN MANAGER" />
        <View style={styles.card}>
          {plansLoading ? (
            <View style={styles.planLoadingWrap}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.planLoadingText}>Loading plans…</Text>
            </View>
          ) : plansError ? (
            <TouchableOpacity style={styles.planLoadingWrap} onPress={fetchPlans}>
              <Text style={styles.planErrorText}>{plansError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          ) : plans.length === 0 ? (
            <Text style={styles.emptyPlansText}>No plans yet. Add one below.</Text>
          ) : (
            plans.map((plan, i) => (
              <React.Fragment key={plan.id}>
                <View style={styles.planRow}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>
                      {PLAN_TYPE_LABELS[plan.type as PlanType] ?? plan.type} · {plan.durationDays} days
                    </Text>
                  </View>
                  <View style={styles.planRight}>
                    <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                    <TouchableOpacity onPress={() => openEdit(plan)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="create-outline" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(plan)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={Colors.expiredRed} />
                    </TouchableOpacity>
                  </View>
                </View>
                {i < plans.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
          <TouchableOpacity style={styles.addPlanBtn} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
            <Text style={styles.addPlanText}>Add New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* ── App ──────────────────────────────────────────────────────────── */}
        <SectionHeader label="APP" />
        <View style={styles.card}>
          <RowItem icon="information-circle-outline" label="About" onPress={() => {}} />
          <View style={styles.divider} />
          <RowItem icon="code-slash-outline" label="Version" value="1.0.0" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.expiredRed} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Plan Create / Edit Modal ──────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'Edit Plan' : 'New Plan'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={styles.fieldLabel}>Plan Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Monthly Basic"
                placeholderTextColor={Colors.textMuted}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                editable={!saving}
              />

              {/* Type */}
              <Text style={styles.fieldLabel}>Plan Type</Text>
              <View style={styles.typeRow}>
                {PLAN_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                    onPress={() => setForm(f => ({ ...f, type: t }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                      {PLAN_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={styles.fieldLabel}>Duration (days) *</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={form.durationDays > 0 ? String(form.durationDays) : ''}
                onChangeText={v => setForm(f => ({ ...f, durationDays: parseInt(v, 10) || 0 }))}
                editable={!saving}
              />

              {/* Price */}
              <Text style={styles.fieldLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={form.price > 0 ? String(form.price) : ''}
                onChangeText={v => setForm(f => ({ ...f, price: parseFloat(v) || 0 }))}
                editable={!saving}
              />

              {/* Features */}
              <Text style={styles.fieldLabel}>Features</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="e.g. Cardio access, Locker"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={form.features}
                onChangeText={v => setForm(f => ({ ...f, features: v }))}
                editable={!saving}
              />

              {/* Error */}
              {formError && <Text style={styles.formError}>{formError}</Text>}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.saveBtnText}>{editingPlan ? 'Update' : 'Create'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: scale(Layout.spacing.lg),
    gap: verticalScale(8),
    paddingBottom: verticalScale(40),
  },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textMuted,
    letterSpacing: 0.06,
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(4),
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  rowLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  rowValue: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
    marginRight: scale(6),
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: scale(14),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(14),
  },
  leadTimeWrap: {
    padding: moderateScale(14),
    gap: verticalScale(10),
  },
  segmentRow: {
    flexDirection: 'row',
    gap: scale(6),
  },
  segment: {
    flex: 1,
    paddingVertical: verticalScale(6),
    alignItems: 'center',
    borderRadius: moderateScale(Layout.radius.sm),
    backgroundColor: Colors.background,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  segmentActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  segmentText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  // Plan rows
  planLoadingWrap: {
    padding: moderateScale(20),
    alignItems: 'center',
    gap: verticalScale(6),
  },
  planLoadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  planErrorText: {
    ...Typography.caption,
    color: Colors.expiredRed,
    textAlign: 'center',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  retryText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  emptyPlansText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: moderateScale(20),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(14),
  },
  planInfo: {
    flex: 1,
    marginRight: scale(8),
  },
  planName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  planDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(2),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  planPrice: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.accent,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    padding: moderateScale(14),
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  addPlanText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    padding: moderateScale(14),
    backgroundColor: Colors.expiredBg,
    borderRadius: moderateScale(Layout.radius.md),
    marginTop: verticalScale(8),
  },
  logoutText: {
    ...Typography.body,
    color: Colors.expiredRed,
    fontWeight: '600',
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: scale(20),
    paddingBottom: verticalScale(36),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.heading3.fontSize ?? 16),
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: verticalScale(4),
    marginTop: verticalScale(12),
    fontSize: moderateScale(Typography.label.fontSize ?? 11),
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: moderateScale(Layout.radius.sm),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
    backgroundColor: Colors.background,
  },
  inputMulti: {
    minHeight: verticalScale(72),
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  typeChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(Layout.radius.full),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeChipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  typeChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  formError: {
    ...Typography.caption,
    color: Colors.expiredRed,
    marginTop: verticalScale(8),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(20),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(Layout.radius.sm),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  saveBtn: {
    flex: 2,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(Layout.radius.sm),
    backgroundColor: Colors.accent,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
});