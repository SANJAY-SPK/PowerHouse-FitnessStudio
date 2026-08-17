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
import { alertSettingsService, AlertSettings } from '@/services/alertSettingsService';

// ─── Plan type options ─────────────────────────────────────────────────────────
const PLAN_TYPES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'LIFETIME', 'PT_MONTHLY', 'PT_3MONTHS'] as const;
type PlanType = typeof PLAN_TYPES[number];

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  YEARLY: 'Yearly',
  LIFETIME: 'Lifetime',
  PT_MONTHLY: 'PT Monthly',
  PT_3MONTHS: 'PT 3 Months',
};

// ─── Blank form state ──────────────────────────────────────────────────────────
const BLANK_FORM: PlanPayload = {
  name: '',
  type: 'MONTHLY',
  durationDays: 30,
  price: 0,
  features: '',
};

const INACTIVE_DAY_OPTIONS = [7, 10, 14, 21, 30] as const;

// ─── Gym info row ─────────────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, iconBg, iconColor, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={infoRowStyles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[infoRowStyles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={infoRowStyles.textWrap}>
        <Text style={infoRowStyles.label}>{label}</Text>
        {value && <Text style={infoRowStyles.value}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  iconBox: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  value: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
});

export default function SettingsScreen() {
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [inactiveAlerts, setInactiveAlerts] = useState(true);
  const [leadTime, setLeadTime] = useState(7);
  const [inactiveDays, setInactiveDays] = useState(14);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const { logout } = useAuthStore();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanPayload>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    alertSettingsService.load().then(s => {
      setLeadTime(s.leadTime);
      setInactiveDays(s.inactiveDays);
    });
  }, []);

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

  const handleSaveAlertSettings = async () => {
    await alertSettingsService.save({ leadTime, inactiveDays });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

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

  return (
    <View style={styles.root}>
      <AppHeader title="Settings" showBack={true} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>



        {/* ── Notifications ───────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={13} color={Colors.accent} />
          <Text style={styles.sectionHeaderText}>NOTIFICATIONS & ALERTS</Text>
        </View>
        <View style={styles.card}>
          {/* Switches */}
          {[
            { label: 'Expiry Alerts',           icon: 'time-outline'          as const, color: Colors.expiringAmber, bg: 'rgba(245,158,11,0.1)',  value: expiryAlerts,   set: setExpiryAlerts   },
            { label: 'Payment Alerts',          icon: 'wallet-outline'        as const, color: Colors.expiredRed,    bg: 'rgba(239,68,68,0.1)',    value: paymentAlerts,  set: setPaymentAlerts  },
            { label: 'Inactive Member Alerts',  icon: 'person-remove-outline' as const, color: Colors.pausedGray,    bg: 'rgba(156,163,175,0.1)', value: inactiveAlerts, set: setInactiveAlerts },
          ].map(({ label, icon, color, bg, value, set }) => (
            <View key={label} style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.switchIcon, { backgroundColor: bg }]}>
                  <Ionicons name={icon} size={15} color={color} />
                </View>
                <Text style={styles.switchLabel}>{label}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={set}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor="#fff"
              />
            </View>
          ))}

          <View style={styles.divider} />

          {/* Expiry Lead Time */}
          <View style={styles.settingBlock}>
            <View style={styles.settingBlockHeader}>
              <Ionicons name="alarm-outline" size={14} color={Colors.textMuted} />
              <View>
                <Text style={styles.settingBlockTitle}>Expiry Alert Lead Time</Text>
                <Text style={styles.settingBlockSub}>Alert when plan expires within N days</Text>
              </View>
            </View>
            <View style={styles.segmentRow}>
              {[3, 5, 7, 10, 14].map(d => (
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

          <View style={styles.divider} />

          {/* Inactive Days */}
          <View style={styles.settingBlock}>
            <View style={styles.settingBlockHeader}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <View>
                <Text style={styles.settingBlockTitle}>Inactive Alert Threshold</Text>
                <Text style={styles.settingBlockSub}>Alert when no check-in for N days</Text>
              </View>
            </View>
            <View style={styles.segmentRow}>
              {INACTIVE_DAY_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.segment, inactiveDays === d && styles.segmentActive]}
                  onPress={() => setInactiveDays(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, inactiveDays === d && styles.segmentTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveSettingsBtn, settingsSaved && styles.saveSettingsBtnSaved]}
            onPress={handleSaveAlertSettings}
            activeOpacity={0.8}
          >
            <Ionicons
              name={settingsSaved ? 'checkmark-circle' : 'save-outline'}
              size={16}
              color="#fff"
            />
            <Text style={styles.saveSettingsBtnText}>
              {settingsSaved ? '✓ Settings Saved!' : 'Save Alert Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Plan Manager ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={13} color={Colors.accent} />
          <Text style={styles.sectionHeaderText}>PLAN MANAGER</Text>
        </View>
        <View style={styles.card}>
          {plansLoading ? (
            <View style={styles.planLoadingWrap}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.planLoadingText}>Loading plans…</Text>
            </View>
          ) : plansError ? (
            <TouchableOpacity style={styles.planLoadingWrap} onPress={fetchPlans}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.expiredRed} />
              <Text style={styles.planErrorText}>{plansError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          ) : plans.length === 0 ? (
            <View style={styles.planLoadingWrap}>
              <Ionicons name="layers-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyPlansText}>No plans yet. Add one below.</Text>
            </View>
          ) : (
            plans.map((plan, i) => {
              const isPt = plan.type === 'PT_MONTHLY' || plan.type === 'PT_3MONTHS' ||
                plan.name?.toUpperCase().startsWith('PT');
              return (
                <React.Fragment key={plan.id}>
                  <View style={styles.planRow}>
                    <View style={[styles.planTypeIndicator, { backgroundColor: isPt ? 'rgba(198,134,10,0.12)' : 'rgba(152,37,152,0.08)' }]}>
                      <Ionicons
                        name={isPt ? 'fitness-outline' : 'barbell-outline'}
                        size={16}
                        color={isPt ? '#C6860A' : Colors.accent}
                      />
                    </View>
                    <View style={styles.planInfo}>
                      <View style={styles.planNameRow}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        {isPt && (
                          <View style={styles.planPtBadge}>
                            <Text style={styles.planPtBadgeText}>PT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planDuration}>
                        {PLAN_TYPE_LABELS[plan.type as PlanType] ?? plan.type} · {plan.durationDays} days
                      </Text>
                    </View>
                    <View style={styles.planRight}>
                      <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                      <TouchableOpacity
                        style={styles.planActionBtn}
                        onPress={() => openEdit(plan)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="create-outline" size={16} color={Colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.planActionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                        onPress={() => handleDelete(plan)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.expiredRed} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i < plans.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })
          )}
          <TouchableOpacity style={styles.addPlanBtn} onPress={openCreate}>
            <View style={styles.addPlanIconBox}>
              <Ionicons name="add" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.addPlanText}>Add New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* ── App ─────────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="apps-outline" size={13} color={Colors.accent} />
          <Text style={styles.sectionHeaderText}>APP</Text>
        </View>
        <View style={styles.card}>
          <InfoRow icon="code-slash-outline" label="Version" value="1.0.3" iconBg="rgba(21,23,61,0.06)" iconColor={Colors.textMuted} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={18} color={Colors.expiredRed} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.expiredRed} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <Text style={styles.footerText}>PowerHouse Fitness Studio © 2026</Text>

      </ScrollView>

      {/* ── Plan Create / Edit Modal ─────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIcon}>
                  <Ionicons name={editingPlan ? 'create' : 'add-circle'} size={18} color={Colors.accent} />
                </View>
                <Text style={styles.modalTitle}>
                  {editingPlan ? 'Edit Plan' : 'New Plan'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={closeModal}
                disabled={saving}
              >
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <Text style={styles.fieldLabel}>PLAN NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. PT Monthly"
                placeholderTextColor={Colors.textMuted}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                editable={!saving}
              />

              {/* Type */}
              <Text style={styles.fieldLabel}>PLAN TYPE</Text>
              <View style={styles.typeRow}>
                {PLAN_TYPES.map(t => {
                  const isPtType = t === 'PT_MONTHLY' || t === 'PT_3MONTHS';
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        form.type === t && styles.typeChipActive,
                        isPtType && styles.typeChipPt,
                        form.type === t && isPtType && styles.typeChipPtActive,
                      ]}
                      onPress={() => setForm(f => ({ ...f, type: t }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.typeChipText,
                        form.type === t && styles.typeChipTextActive,
                        isPtType && form.type !== t && { color: '#C6860A' },
                      ]}>
                        {PLAN_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration */}
              <Text style={styles.fieldLabel}>DURATION (DAYS) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 30"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={form.durationDays > 0 ? String(form.durationDays) : ''}
                onChangeText={v => setForm(f => ({ ...f, durationDays: parseInt(v, 10) || 0 }))}
                editable={!saving}
              />

              {/* Price */}
              <Text style={styles.fieldLabel}>PRICE (₹) *</Text>
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
              <Text style={styles.fieldLabel}>FEATURES</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="e.g. Personal training, Nutrition plan"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={form.features}
                onChangeText={v => setForm(f => ({ ...f, features: v }))}
                editable={!saving}
              />

              {/* Error */}
              {formError && (
                <View style={styles.formErrorBox}>
                  <Ionicons name="alert-circle" size={14} color={Colors.expiredRed} />
                  <Text style={styles.formError}>{formError}</Text>
                </View>
              )}

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
                    : <>
                        <Ionicons name={editingPlan ? 'checkmark-circle' : 'add-circle'} size={16} color="#fff" />
                        <Text style={styles.saveBtnText}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Text>
                      </>
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
    paddingBottom: verticalScale(50),
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(4),
  },
  sectionHeaderText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.0,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#15173D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: scale(14),
  },

  // Switch rows
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 1,
  },
  switchIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(13),
  },

  // Setting blocks
  settingBlock: {
    padding: moderateScale(14),
    gap: verticalScale(10),
  },
  settingBlockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(8),
  },
  settingBlockTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  settingBlockSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
  segmentRow: {
    flexDirection: 'row',
    gap: scale(6),
  },
  segment: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(10),
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  saveSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    margin: moderateScale(14),
    marginTop: verticalScale(4),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveSettingsBtnSaved: {
    backgroundColor: Colors.activeGreen,
    shadowColor: Colors.activeGreen,
  },
  saveSettingsBtnText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  // Plan rows
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    gap: scale(10),
  },
  planTypeIndicator: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
    marginRight: scale(8),
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  planName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  planPtBadge: {
    backgroundColor: '#C6860A',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(4),
  },
  planPtBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: moderateScale(8),
    letterSpacing: 0.2,
  },
  planDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  planPrice: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.accent,
    fontSize: moderateScale(13),
    marginRight: scale(4),
  },
  planActionBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152,37,152,0.08)',
  },
  planLoadingWrap: {
    padding: moderateScale(24),
    alignItems: 'center',
    gap: verticalScale(8),
  },
  planLoadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  planErrorText: {
    ...Typography.caption,
    color: Colors.expiredRed,
    textAlign: 'center',
    fontSize: moderateScale(12),
  },
  retryText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  emptyPlansText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: moderateScale(13),
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    padding: moderateScale(14),
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  addPlanIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152,37,152,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(152,37,152,0.2)',
    borderStyle: 'dashed',
  },
  addPlanText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    padding: moderateScale(14),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.25)',
    marginTop: verticalScale(4),
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: {
    ...Typography.body,
    color: Colors.expiredRed,
    fontWeight: '700',
    fontSize: moderateScale(14),
    flex: 1,
  },

  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: moderateScale(10),
    marginTop: verticalScale(8),
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: scale(20),
    paddingBottom: verticalScale(40),
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: Colors.border,
    borderRadius: moderateScale(4),
    alignSelf: 'center',
    marginBottom: verticalScale(16),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  modalTitleIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(152,37,152,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: verticalScale(6),
    marginTop: verticalScale(14),
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
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
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(Layout.radius.full),
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeChipPt: {
    borderColor: '#C6860A',
    backgroundColor: 'rgba(198,134,10,0.06)',
  },
  typeChipPtActive: {
    backgroundColor: '#C6860A',
    borderColor: '#C6860A',
  },
  typeChipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  typeChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(8),
    padding: moderateScale(10),
    backgroundColor: Colors.expiredBg,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  formError: {
    ...Typography.caption,
    color: Colors.expiredRed,
    fontSize: moderateScale(12),
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(20),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(13),
    alignItems: 'center',
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cancelBtnText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: verticalScale(13),
    borderRadius: moderateScale(12),
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
});