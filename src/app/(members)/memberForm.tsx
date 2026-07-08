import React, { useState, useEffect } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity,
  Text, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '@/store/memberStore';
import { usePlanStore } from '@/store/planStore';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

type PaymentMode = 'CASH' | 'UPI' | 'CARD';
type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  startDate?: string;
  plan?: string;
};

function isPtPlanName(name: string): boolean {
  return name?.trim().toUpperCase().startsWith('PT') ?? false;
}

// ── Reusable field input ──────────────────────────────────────────────────────
function FieldInput({
  label, value, onChangeText, placeholder, error,
  keyboardType, autoCapitalize, icon, required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; error?: string;
  keyboardType?: any; autoCapitalize?: any;
  icon: keyof typeof Ionicons.glyphMap; required?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      </View>
      <View style={[fieldStyles.inputBox, !!error && fieldStyles.inputBoxError]}>
        <View style={fieldStyles.iconBox}>
          <Ionicons name={icon} size={16} color={error ? Colors.expiredRed : Colors.accent} />
        </View>
        <TextInput
          style={fieldStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
        />
      </View>
      {!!error && (
        <View style={fieldStyles.errorRow}>
          <Ionicons name="alert-circle" size={11} color={Colors.expiredRed} />
          <Text style={fieldStyles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ── Date picker field ─────────────────────────────────────────────────────────
function DateField({
  label, value, onPress, error, required, placeholder,
}: {
  label: string; value: string; onPress: () => void;
  error?: string; required?: boolean; placeholder: string;
}) {
  const formatted = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '';
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      </View>
      <TouchableOpacity
        style={[fieldStyles.inputBox, !!error && fieldStyles.inputBoxError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={fieldStyles.iconBox}>
          <Ionicons name="calendar" size={16} color={error ? Colors.expiredRed : Colors.accent} />
        </View>
        <Text style={[fieldStyles.input, { color: value ? Colors.textPrimary : Colors.textMuted }]}>
          {formatted || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.textMuted} style={{ marginRight: scale(4) }} />
      </TouchableOpacity>
      {!!error && (
        <View style={fieldStyles.errorRow}>
          <Ionicons name="alert-circle" size={11} color={Colors.expiredRed} />
          <Text style={fieldStyles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: verticalScale(12) },
  labelRow: { flexDirection: 'row', marginBottom: verticalScale(5) },
  label: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  required: { color: Colors.expiredRed },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    minHeight: verticalScale(48),
  },
  inputBoxError: { borderColor: Colors.expiredRed },
  iconBox: {
    width: moderateScale(44),
    height: '100%',
    minHeight: verticalScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152,37,152,0.05)',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: verticalScale(4),
  },
  errorText: {
    ...Typography.caption,
    color: Colors.expiredRed,
    fontSize: moderateScale(10),
  },
});

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.iconBox}>
        <Ionicons name={icon} size={14} color={Colors.accent} />
      </View>
      <Text style={sectionStyles.text}>{label}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(12),
  },
  iconBox: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(7),
    backgroundColor: 'rgba(152,37,152,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
});

// ── Payment mode icons ────────────────────────────────────────────────────────
const PAYMENT_MODE_CONFIG: Record<PaymentMode, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  UPI:  { icon: 'phone-portrait-outline', label: 'UPI',  color: '#6366F1' },
  CASH: { icon: 'cash-outline',           label: 'Cash', color: '#22c55e' },
  CARD: { icon: 'card-outline',           label: 'Card', color: '#0284C7' },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function MemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { selectedMember, fetchMemberById, addMember, updateMember, isLoading } = useMemberStore();
  const { plans, fetchPlans } = usePlanStore();

  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [dob, setDob]             = useState('');
  const [address, setAddress]     = useState('');
  const [trainer, setTrainer]     = useState('None');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'due'>('paid');
  const [notes, setNotes]         = useState('');
  const [errors, setErrors]       = useState<FormErrors>({});

  const [showDobPicker, setShowDobPicker]     = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (isEditing && id) fetchMemberById(Number(id));
  }, []);

  useEffect(() => {
    if (isEditing && selectedMember) {
      setName(selectedMember.name ?? '');
      setPhone(selectedMember.phone ?? '');
      setEmail(selectedMember.email ?? '');
      setDob(selectedMember.dateOfBirth ?? '');
      setAddress(selectedMember.address ?? '');
      setNotes(selectedMember.notes ?? '');
      setStartDate(selectedMember.planStartDate ?? new Date().toISOString().split('T')[0]);
      const matchedPlan = plans.find(p => p.name === selectedMember.planName);
      if (matchedPlan) {
        setSelectedPlanId(matchedPlan.id);
        setTrainer(isPtPlanName(matchedPlan.name) ? 'Deepak Trainer' : (selectedMember.assignedTrainer ?? 'None'));
      } else {
        setTrainer(selectedMember.assignedTrainer ?? 'None');
      }
    }
  }, [selectedMember, plans]);

  const handleDobConfirm = (date: Date) => {
    setShowDobPicker(false);
    setDob(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const handleStartConfirm = (date: Date) => {
    setShowStartPicker(false);
    setStartDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan && isPtPlanName(plan.name)) {
      setTrainer('Deepak Trainer');
    } else {
      setTrainer(prev => prev === 'Deepak Trainer' ? 'None' : prev);
    }
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim())   e.name = 'Full name is required';
    if (!phone.trim())  e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Must be 10 digits';
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Invalid email';
    if (dob.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) e.dob = 'Use YYYY-MM-DD';
    if (!startDate.trim()) e.startDate = 'Start date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) e.startDate = 'Use YYYY-MM-DD';
    if (!selectedPlanId) e.plan = 'Please select a plan';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      name:            name.trim(),
      phone:           phone.trim(),
      email:           email.trim() || undefined,
      dateOfBirth:     dob.trim() || undefined,
      address:         address.trim() || undefined,
      assignedTrainer: trainer === 'None' ? undefined : trainer,
      planId:          selectedPlanId,
      planStartDate:   startDate,
      paymentAmount:   plans.find(p => p.id === selectedPlanId)?.price ?? 0,
      paymentStatus:   paymentStatus.toUpperCase(),
      paymentMode:     paymentStatus === 'paid' ? paymentMode : undefined,
      notes:           notes.trim() || undefined,
    };
    try {
      if (isEditing && id) {
        await updateMember(Number(id), payload);
        router.navigate({ pathname: '/(members)/memberDetail', params: { id, success: 'updated' } });
      } else {
        await addMember(payload);
        router.navigate({ pathname: '/(tabs)/members', params: { success: 'created' } });
      }
    } catch {}
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isPtSelected = selectedPlan ? isPtPlanName(selectedPlan.name) : false;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader
        title={isEditing ? 'Edit Member' : 'Add New Member'}
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Personal Details ─────────────────────────────────────────── */}
        <SectionHeader icon="person-outline" label="Personal Details" />

        <FieldInput
          label="Full Name" value={name} onChangeText={setName}
          placeholder="e.g. Rahul Sharma" error={errors.name}
          icon="person" required
        />
        <FieldInput
          label="Phone Number" value={phone} onChangeText={setPhone}
          placeholder="e.g. 9876543210" error={errors.phone}
          icon="call" keyboardType="phone-pad" autoCapitalize="none" required
        />
        <FieldInput
          label="Email Address" value={email} onChangeText={setEmail}
          placeholder="e.g. rahul@email.com" error={errors.email}
          icon="mail" keyboardType="email-address" autoCapitalize="none"
        />

        <DateField
          label="Date of Birth" value={dob} onPress={() => setShowDobPicker(true)}
          error={errors.dob} placeholder="Choose date of birth…"
        />
        <DateTimePickerModal
          isVisible={showDobPicker}
          mode="date"
          date={dob ? new Date(dob + 'T12:00:00') : new Date(1995, 0, 1)}
          maximumDate={new Date()}
          onConfirm={handleDobConfirm}
          onCancel={() => setShowDobPicker(false)}
          accentColor={Colors.accent}
        />

        <FieldInput
          label="Home Address" value={address} onChangeText={setAddress}
          placeholder="12, Nehru Street, Tiruppur"
          icon="location"
        />

        {/* ── Select Plan ───────────────────────────────────────────────── */}
        <SectionHeader icon="layers-outline" label="Select Plan" />

        {errors.plan && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={13} color={Colors.expiredRed} />
            <Text style={styles.errorBannerText}>{errors.plan}</Text>
          </View>
        )}

        {plans.length === 0 ? (
          <View style={styles.planLoadingBox}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.planLoadingText}>Loading plans…</Text>
          </View>
        ) : (
          <View style={styles.planGrid}>
            {plans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const isPt = isPtPlanName(plan.name);
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && (isPt ? styles.planCardPtSelected : styles.planCardSelected),
                    !isSelected && isPt && styles.planCardPt,
                  ]}
                  onPress={() => handlePlanSelect(plan.id)}
                  activeOpacity={0.75}
                >
                  {/* Top badge row */}
                  <View style={styles.planCardTop}>
                    <View style={[styles.planTypeTag, {
                      backgroundColor: isPt ? 'rgba(198,134,10,0.12)' : 'rgba(152,37,152,0.08)',
                    }]}>
                      <Ionicons
                        name={isPt ? 'fitness-outline' : 'barbell-outline'}
                        size={10}
                        color={isPt ? '#C6860A' : Colors.accent}
                      />
                      {isPt && <Text style={[styles.planTypeTagText, { color: '#C6860A' }]}>PT</Text>}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={isPt ? '#C6860A' : Colors.accent} />
                    )}
                  </View>

                  <Text style={[styles.planCardName, isSelected && {
                    color: isPt ? '#C6860A' : Colors.accent,
                  }]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planCardDuration}>{plan.durationDays} days</Text>
                  <Text style={[styles.planCardPrice, isSelected && {
                    color: isPt ? '#C6860A' : Colors.accent,
                  }]}>
                    ₹{plan.price.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: verticalScale(8) }}>
          <DateField
            label="Plan Start Date" value={startDate}
            onPress={() => setShowStartPicker(true)}
            error={errors.startDate} required
            placeholder="Choose start date…"
          />
          <DateTimePickerModal
            isVisible={showStartPicker}
            mode="date"
            date={startDate ? new Date(startDate + 'T12:00:00') : new Date()}
            onConfirm={handleStartConfirm}
            onCancel={() => setShowStartPicker(false)}
            accentColor={Colors.accent}
          />
        </View>

        {/* ── Assign Trainer ────────────────────────────────────────────── */}
        <SectionHeader icon="people-outline" label="Assign Trainer" />

        {isPtSelected ? (
          <View style={styles.ptTrainerBanner}>
            <View style={styles.ptTrainerIconBox}>
              <Ionicons name="fitness" size={20} color="#C6860A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ptTrainerLabel}>PT Trainer — Auto-assigned</Text>
              <Text style={styles.ptTrainerName}>Deepak Trainer</Text>
            </View>
            <View style={styles.ptLockBadge}>
              <Ionicons name="lock-closed" size={11} color="#C6860A" />
              <Text style={styles.ptLockText}>Fixed</Text>
            </View>
          </View>
        ) : (
          <View style={styles.trainerRow}>
            {['None', 'Deepak Trainer'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.trainerChip, trainer === t && styles.trainerChipActive]}
                onPress={() => setTrainer(t)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={t === 'None' ? 'person-outline' : 'fitness-outline'}
                  size={14}
                  color={trainer === t ? '#fff' : Colors.textMuted}
                />
                <Text style={[styles.trainerChipText, trainer === t && styles.trainerChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Payment Details (create only) ──────────────────────────── */}
        {!isEditing && (
          <>
            <SectionHeader icon="wallet-outline" label="Payment Details" />

            {selectedPlan && (
              <View style={styles.paymentAmountCard}>
                <View style={styles.paymentAmountLeft}>
                  <Text style={styles.paymentAmountLabel}>Amount to Collect</Text>
                  <Text style={styles.paymentAmountSub}>{selectedPlan.name}</Text>
                </View>
                <Text style={styles.paymentAmountValue}>₹{selectedPlan.price.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {/* Paid / Due toggle */}
            <View style={styles.statusToggleRow}>
              {(['paid', 'due'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusToggle,
                    paymentStatus === s && (s === 'paid' ? styles.statusTogglePaid : styles.statusToggleDue),
                  ]}
                  onPress={() => setPaymentStatus(s)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={s === 'paid' ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={paymentStatus === s ? '#fff' : Colors.textMuted}
                  />
                  <Text style={[styles.statusToggleText, paymentStatus === s && { color: '#fff' }]}>
                    {s === 'paid' ? 'Paid' : 'Mark as Due'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment mode */}
            {paymentStatus === 'paid' && (
              <View style={styles.paymentModeRow}>
                {(Object.entries(PAYMENT_MODE_CONFIG) as [PaymentMode, typeof PAYMENT_MODE_CONFIG[PaymentMode]][]).map(([mode, cfg]) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeCard, paymentMode === mode && { borderColor: cfg.color, backgroundColor: `${cfg.color}10` }]}
                    onPress={() => setPaymentMode(mode)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modeIconBox, { backgroundColor: `${cfg.color}15` }]}>
                      <Ionicons name={cfg.icon} size={18} color={paymentMode === mode ? cfg.color : Colors.textMuted} />
                    </View>
                    <Text style={[styles.modeLabel, paymentMode === mode && { color: cfg.color, fontWeight: '700' }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Additional Notes ──────────────────────────────────────────── */}
        <SectionHeader icon="document-text-outline" label="Additional Notes" />
        <View style={styles.notesBox}>
          <View style={[fieldStyles.iconBox, { height: 'auto', minHeight: verticalScale(60), borderRightWidth: 1, borderRightColor: Colors.border, paddingVertical: verticalScale(10) }]}>
            <Ionicons name="create-outline" size={16} color={Colors.accent} />
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Medical conditions, fitness goals, special notes…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Submit / Cancel ───────────────────────────────────────────── */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'checkmark-circle' : 'person-add'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Save Changes' : 'Add Member'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    padding: scale(Layout.spacing.lg),
    paddingBottom: verticalScale(60),
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: Colors.expiredBg,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  errorBannerText: {
    ...Typography.caption,
    color: Colors.expiredRed,
    fontSize: moderateScale(11),
    flex: 1,
  },

  // Plans
  planLoadingBox: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(20),
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planLoadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  planCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    gap: verticalScale(4),
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(152,37,152,0.05)',
  },
  planCardPt: {
    borderColor: 'rgba(198,134,10,0.35)',
    backgroundColor: 'rgba(198,134,10,0.35)',
  },
  planCardPtSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(152,37,152,0.05)',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  planTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(5),
  },
  planTypeTagText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
  },
  planCardName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  planCardDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
  },
  planCardPrice: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: Colors.accent,
    marginTop: verticalScale(2),
  },

  // Trainer
  ptTrainerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    backgroundColor: 'rgba(198,134,10,0.07)',
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(198,134,10,0.35)',
    padding: moderateScale(12),
  },
  ptTrainerIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(198,134,10,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ptTrainerLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#C6860A',
    letterSpacing: 0.2,
  },
  ptTrainerName: {
    ...Typography.body,
    color: '#92400e',
    fontWeight: '800',
    fontSize: moderateScale(14),
    marginTop: verticalScale(1),
  },
  ptLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    backgroundColor: 'rgba(198,134,10,0.12)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  ptLockText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#C6860A',
  },
  trainerRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  trainerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
  },
  trainerChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  trainerChipText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  trainerChipTextActive: { color: '#fff', fontWeight: '700' },

  // Payment
  paymentAmountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(152,37,152,0.06)',
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: 'rgba(152,37,152,0.2)',
    padding: moderateScale(14),
    marginBottom: verticalScale(12),
  },
  paymentAmountLeft: { gap: verticalScale(2) },
  paymentAmountLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(11),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  paymentAmountSub: {
    ...Typography.caption,
    color: Colors.accent,
    fontSize: moderateScale(11),
  },
  paymentAmountValue: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: Colors.accent,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  statusToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
  },
  statusTogglePaid: {
    backgroundColor: Colors.activeGreen,
    borderColor: Colors.activeGreen,
    shadowColor: Colors.activeGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusToggleDue: {
    backgroundColor: Colors.expiredRed,
    borderColor: Colors.expiredRed,
    shadowColor: Colors.expiredRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusToggleText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textMuted,
    fontSize: moderateScale(13),
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(6),
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
  },
  modeIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },

  // Notes
  notesBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    minHeight: verticalScale(80),
  },
  notesInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
    padding: scale(12),
    textAlignVertical: 'top',
  },

  // Actions
  formActions: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(28),
  },
  cancelButton: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  submitButton: {
    flex: 2,
    height: verticalScale(50),
    borderRadius: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
});