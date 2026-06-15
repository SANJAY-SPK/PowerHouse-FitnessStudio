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

type PaymentMode = 'CASH' | 'UPI' | 'CARD';

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  startDate?: string;
  plan?: string;
};

export default function MemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { selectedMember, fetchMemberById, addMember, updateMember, isLoading } = useMemberStore();
  const { plans, fetchPlans } = usePlanStore();

  // Form state
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

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
    if (isEditing && id) {
      fetchMemberById(Number(id));
    }
  }, []);

  // Prefill form when editing
  useEffect(() => {
    if (isEditing && selectedMember) {
      setName(selectedMember.name ?? '');
      setPhone(selectedMember.phone ?? '');
      setEmail(selectedMember.email ?? '');
      setDob(selectedMember.dateOfBirth ?? '');
      setAddress(selectedMember.address ?? '');
      setTrainer(selectedMember.assignedTrainer ?? 'None');
      setNotes(selectedMember.notes ?? '');
      setStartDate(selectedMember.planStartDate ?? new Date().toISOString().split('T')[0]);
      // Match plan by name since we now have plan objects from API
      const matchedPlan = plans.find(p => p.name === selectedMember.planName);
      if (matchedPlan) setSelectedPlanId(matchedPlan.id);
    }
  }, [selectedMember, plans]);

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
      name:             name.trim(),
      phone:            phone.trim(),
      email:            email.trim() || undefined,
      dateOfBirth:      dob.trim() || undefined,
      address:          address.trim() || undefined,
      assignedTrainer:  trainer === 'None' ? undefined : trainer,
      planId:           selectedPlanId,
      planStartDate:    startDate,
      paymentAmount:    plans.find(p => p.id === selectedPlanId)?.price ?? 0,
      paymentStatus:    paymentStatus.toUpperCase(),  // 'PAID' | 'DUE'
      paymentMode:      paymentStatus === 'paid' ? paymentMode : undefined,
      notes:            notes.trim() || undefined,
    };

    try {
      if (isEditing && id) {
        await updateMember(Number(id), payload);
        router.replace({
          pathname: '/(members)/memberDetail',
          params: { id, success: 'updated' },
        });
      } else {
        await addMember(payload);
        router.replace({
          pathname: '/(tabs)/members',
          params: { success: 'created' },
        });
      }
    } catch {
      // error shown via store.error
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

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

        {/* Personal Details */}
        <Text style={styles.sectionTitle}>Personal Details</Text>

        {(
          [
            { label: 'Full Name *',              value: name,    setter: setName,    key: 'name',    placeholder: 'e.g. Rahul Sharma',        keyboard: 'default' },
            { label: 'Phone Number *',           value: phone,   setter: setPhone,   key: 'phone',   placeholder: 'e.g. 9876543210',          keyboard: 'phone-pad' },
            { label: 'Email Address',            value: email,   setter: setEmail,   key: 'email',   placeholder: 'e.g. rahul@email.com',     keyboard: 'email-address' },
            { label: 'Date of Birth (YYYY-MM-DD)', value: dob,  setter: setDob,     key: 'dob',     placeholder: 'e.g. 1995-08-25',          keyboard: 'default' },
            { label: 'Home Address',             value: address, setter: setAddress, key: undefined, placeholder: '12, Nehru Street, Tiruppur', keyboard: 'default' },
          ] as const
        ).map(field => (
          <View style={styles.formField} key={field.label}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <TextInput
              style={[
                styles.textInput,
                field.key && errors[field.key as keyof FormErrors] && styles.textInputError,
              ]}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.textMuted}
              value={field.value}
              onChangeText={field.setter as (v: string) => void}
              keyboardType={field.keyboard as any}
              autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
            />
            {field.key && errors[field.key as keyof FormErrors] && (
              <Text style={styles.errorText}>{errors[field.key as keyof FormErrors]}</Text>
            )}
          </View>
        ))}

        {/* Plan Selector */}
        <Text style={styles.sectionTitle}>Select Plan</Text>
        {errors.plan && <Text style={styles.errorText}>{errors.plan}</Text>}
        {plans.length === 0 ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.planContainer}>
            {plans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.planCardHeader}>
                    <Text style={[styles.planCardName, isSelected && { color: Colors.accent, fontWeight: '700' }]}>
                      {plan.name}
                    </Text>
                    <Text style={styles.planCardPrice}>₹{plan.price}</Text>
                  </View>
                  <Text style={styles.planCardDuration}>{plan.durationDays} days</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={moderateScale(18)}
                      color={Colors.accent}
                      style={{ position: 'absolute', top: 10, right: 10 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.formField, { marginTop: verticalScale(14) }]}>
          <Text style={styles.inputLabel}>Plan Start Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={[styles.textInput, errors.startDate && styles.textInputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            value={startDate}
            onChangeText={setStartDate}
          />
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>

        {/* Trainer */}
        <Text style={styles.sectionTitle}>Assign Trainer</Text>
        <View style={styles.chipGroup}>
          {['None', 'Raj Kumar', 'Meena Devi'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.formChip, trainer === t && styles.formChipActive]}
              onPress={() => setTrainer(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.formChipText, trainer === t && styles.formChipTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment — create only */}
        {!isEditing && (
          <>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            {selectedPlan && (
              <View style={styles.planSummary}>
                <Text style={styles.planSummaryLabel}>Amount to collect</Text>
                <Text style={styles.planSummaryAmount}>₹{selectedPlan.price}</Text>
              </View>
            )}
            <View style={styles.paymentStatusRow}>
              {(['paid', 'due'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusBtn,
                    paymentStatus === s && (s === 'paid' ? styles.statusBtnPaid : styles.statusBtnDue),
                  ]}
                  onPress={() => setPaymentStatus(s)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={s === 'paid' ? 'checkmark-circle-outline' : 'time-outline'}
                    size={16}
                    color={paymentStatus === s ? '#fff' : Colors.textMuted}
                  />
                  <Text style={[styles.statusBtnText, paymentStatus === s && { color: '#fff' }]}>
                    {s === 'paid' ? 'Paid' : 'Due'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentStatus === 'paid' && (
              <View style={{ marginTop: verticalScale(12) }}>
                <Text style={styles.subLabel}>Payment Mode</Text>
                <View style={styles.chipGroup}>
                  {(['UPI', 'CASH', 'CARD'] as const).map(mode => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.formChip, paymentMode === mode && styles.formChipActive]}
                      onPress={() => setPaymentMode(mode)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.formChipText, paymentMode === mode && styles.formChipTextActive]}>
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Notes */}
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <View style={styles.formField}>
          <TextInput
            style={[styles.textInput, { height: verticalScale(60), textAlignVertical: 'top', paddingTop: verticalScale(8) }]}
            placeholder="Medical conditions, fitness goals…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Actions */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formButton, styles.submitButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Save Changes' : 'Add Member'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: scale(20) },
  scrollContent: { paddingBottom: verticalScale(40) },
  sectionTitle: {
    ...Typography.heading3, color: Colors.textPrimary,
    marginTop: verticalScale(20), marginBottom: verticalScale(10),
    fontSize: moderateScale(14),
  },
  formField: { marginBottom: verticalScale(12) },
  inputLabel: {
    ...Typography.caption, color: Colors.textMuted,
    marginBottom: verticalScale(4), fontWeight: '600', fontSize: moderateScale(11),
  },
  subLabel: {
    ...Typography.caption, color: Colors.textMuted,
    marginBottom: verticalScale(6), fontWeight: '500', fontSize: moderateScale(11),
  },
  textInput: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: moderateScale(8), paddingHorizontal: scale(12),
    height: verticalScale(44), color: Colors.textPrimary, fontSize: moderateScale(14),
  },
  textInputError: { borderColor: Colors.expiredRed },
  errorText: {
    ...Typography.caption, color: Colors.expiredRed,
    marginTop: verticalScale(3), fontSize: moderateScale(10),
  },
  planContainer: { gap: verticalScale(8) },
  planCard: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: moderateScale(8), padding: moderateScale(12),
  },
  planCardSelected: {
    borderColor: Colors.accent, backgroundColor: 'rgba(152,37,152,0.04)', borderWidth: 1.5,
  },
  planCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: verticalScale(4),
  },
  planCardName: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  planCardPrice: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  planCardDuration: { ...Typography.caption, color: Colors.textMuted, fontSize: moderateScale(11) },
  chipGroup: { flexDirection: 'row', gap: scale(8), flexWrap: 'wrap' },
  formChip: {
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: moderateScale(20), paddingHorizontal: scale(16), paddingVertical: verticalScale(8),
  },
  formChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  formChipText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '500' },
  formChipTextActive: { color: '#fff', fontWeight: '600' },
  planSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(152,37,152,0.06)',
    borderRadius: moderateScale(8), padding: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  planSummaryLabel: { ...Typography.caption, color: Colors.textMuted },
  planSummaryAmount: { ...Typography.heading3, color: Colors.accent, fontSize: moderateScale(16) },
  paymentStatusRow: { flexDirection: 'row', gap: scale(10) },
  statusBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(6), backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: moderateScale(8), height: verticalScale(44),
  },
  statusBtnPaid: { backgroundColor: Colors.activeGreen, borderColor: Colors.activeGreen },
  statusBtnDue: { backgroundColor: Colors.expiredRed, borderColor: Colors.expiredRed },
  statusBtnText: { ...Typography.body, fontWeight: '600', color: Colors.textPrimary },
  formActions: { flexDirection: 'row', gap: scale(10), marginTop: verticalScale(28) },
  formButton: {
    flex: 1, height: verticalScale(46), borderRadius: moderateScale(8),
    alignItems: 'center', justifyContent: 'center',
  },
  cancelButton: { backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border },
  submitButton: { backgroundColor: Colors.accent, elevation: 3 },
  cancelButtonText: { color: Colors.textPrimary, fontWeight: '600', fontSize: moderateScale(14) },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(14) },
});