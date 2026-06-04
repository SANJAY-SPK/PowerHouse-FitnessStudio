import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '@/context/MembersContext';
import { Colors, Typography, Layout } from '@/constants/theme';
import { mockPlans } from '@/data/mockPlans';
import AppHeader from '@/components/AppHeader';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

type PaymentStatus = 'paid' | 'due';
type PaymentMode = 'cash' | 'upi' | 'card';

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  startDate?: string;
};

export default function MemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { members, addMember, updateMember } = useMembers();

  const isEditing = !!id;
  const existing = isEditing ? members.find(m => m.id === id) : undefined;

  // Personal details
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [dob, setDob] = useState(existing?.dateOfBirth ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [trainer, setTrainer] = useState(existing?.assignedTrainer ?? 'None');

  // Plan details
  const [selectedPlanId, setSelectedPlanId] = useState(
    existing?.planId ?? 'plan_monthly_pro'
  );
  const [startDate, setStartDate] = useState(
    existing?.planStartDate ?? new Date().toISOString().split('T')[0]
  );

  // Payment
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    (existing?.payments?.[0]?.status as PaymentStatus) ?? 'paid'
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    (existing?.payments?.[0]?.mode as PaymentMode) ?? 'upi'
  );

  // Notes
  const [notes, setNotes] = useState(existing?.notes ?? '');

  // Validation
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }
    if (dob.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
      newErrors.dob = 'Use format YYYY-MM-DD';
    }
    if (!startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      newErrors.startDate = 'Use format YYYY-MM-DD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const selectedPlan = mockPlans.find(p => p.id === selectedPlanId)!;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + selectedPlan.durationDays);
    const endDateStr = end.toISOString().split('T')[0];

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      dateOfBirth: dob.trim() || undefined,
      address: address.trim() || undefined,
      assignedTrainer: trainer === 'None' ? undefined : trainer,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planType: selectedPlan.type,
      planStartDate: startDate,
      planEndDate: endDateStr,
      notes: notes.trim() || undefined,
    };

    if (isEditing && id) {
      // Update existing member — preserve existing payments, merge changes
      updateMember(id, payload);
      router.replace({ pathname: '/(members)/memberDetail', params: { id, success: 'updated' } });
    } else {
      // Create new member with initial payment
      const paymentId = 'p_' + Date.now();
      addMember({
        ...payload,
        payments: [
          {
            id: paymentId,
            amount: selectedPlan.price,
            date: startDate,
            planName: selectedPlan.name,
            status: paymentStatus,
            mode: paymentStatus === 'paid' ? paymentMode : undefined,
          },
        ],
      });
      router.replace({ pathname: '/(members)', params: { success: 'created' } });
    }
  };

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
        {/* ── Personal Details ── */}
        <Text style={styles.sectionTitle}>Personal Details</Text>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={[styles.textInput, errors.phone && styles.textInputError]}
            placeholder="e.g. 9876543210"
            placeholderTextColor={Colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.textInput, errors.email && styles.textInputError]}
            placeholder="e.g. rahul@email.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.textInput, errors.dob && styles.textInputError]}
            placeholder="e.g. 1995-08-25"
            placeholderTextColor={Colors.textMuted}
            value={dob}
            onChangeText={setDob}
          />
          {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Home Address</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 12, Nehru Street, Coimbatore"
            placeholderTextColor={Colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* ── Plan ── */}
        <Text style={styles.sectionTitle}>Select Plan</Text>
        <View style={styles.planContainer}>
          {mockPlans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlanId(plan.id)}
                activeOpacity={0.7}
              >
                <View style={styles.planCardHeader}>
                  <Text style={[styles.planCardName, isSelected && styles.textAccent]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planCardPrice}>₹{plan.price}</Text>
                </View>
                <Text style={styles.planCardDuration}>{plan.durationDays} Days Duration</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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

        {/* ── Trainer ── */}
        <Text style={styles.sectionTitle}>Assign Trainer</Text>
        <View style={styles.chipGroup}>
          {['None', 'Raj Kumar', 'Meena Devi'].map(t => {
            const isSelected = trainer === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.formChip, isSelected && styles.formChipActive]}
                onPress={() => setTrainer(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.formChipText, isSelected && styles.formChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Payment — only shown on create ── */}
        {!isEditing && (
          <>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.paymentStatusRow}>
              <TouchableOpacity
                style={[styles.statusBtn, paymentStatus === 'paid' && styles.statusBtnPaid]}
                onPress={() => setPaymentStatus('paid')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={paymentStatus === 'paid' ? '#fff' : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.statusBtnText,
                    paymentStatus === 'paid' && styles.statusBtnTextActive,
                  ]}
                >
                  Paid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, paymentStatus === 'due' && styles.statusBtnDue]}
                onPress={() => setPaymentStatus('due')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={paymentStatus === 'due' ? '#fff' : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.statusBtnText,
                    paymentStatus === 'due' && styles.statusBtnTextActive,
                  ]}
                >
                  Due
                </Text>
              </TouchableOpacity>
            </View>

            {paymentStatus === 'paid' && (
              <View style={{ marginTop: verticalScale(12) }}>
                <Text style={styles.subLabel}>Payment Mode</Text>
                <View style={styles.chipGroup}>
                  {(['upi', 'cash', 'card'] as const).map(mode => {
                    const isSelected = paymentMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.formChip, isSelected && styles.formChipActive]}
                        onPress={() => setPaymentMode(mode)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.formChipText, isSelected && styles.formChipTextActive]}
                        >
                          {mode.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Notes ── */}
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <View style={styles.formField}>
          <TextInput
            style={[
              styles.textInput,
              { height: verticalScale(60), textAlignVertical: 'top', paddingTop: verticalScale(8) },
            ]}
            placeholder="Add optional notes (e.g. medical conditions, fitness goals)…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── Actions ── */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formButton, styles.submitButton]}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Save Changes' : 'Add Member'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    padding: scale(20),
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
    fontSize: moderateScale(14),
  },
  formField: {
    marginBottom: verticalScale(12),
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: verticalScale(4),
    fontWeight: '600',
    fontSize: moderateScale(11),
  },
  subLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: verticalScale(6),
    fontWeight: '500',
    fontSize: moderateScale(11),
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(44),
    color: Colors.textPrimary,
    fontSize: moderateScale(14),
  },
  textInputError: {
    borderColor: Colors.expiredRed,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.expiredRed,
    marginTop: verticalScale(3),
    fontSize: moderateScale(10),
  },
  planContainer: {
    gap: verticalScale(8),
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(152,37,152,0.04)',
    borderWidth: 1.5,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  planCardName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  textAccent: {
    color: Colors.accent,
    fontWeight: '700',
  },
  planCardPrice: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planCardDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  chipGroup: {
    flexDirection: 'row',
    gap: scale(8),
    flexWrap: 'wrap',
  },
  formChip: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  formChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  formChipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  formChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: moderateScale(8),
    height: verticalScale(44),
  },
  statusBtnPaid: {
    backgroundColor: Colors.activeGreen,
    borderColor: Colors.activeGreen,
  },
  statusBtnDue: {
    backgroundColor: Colors.expiredRed,
    borderColor: Colors.expiredRed,
  },
  statusBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(28),
  },
  formButton: {
    flex: 1,
    height: verticalScale(46),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
});