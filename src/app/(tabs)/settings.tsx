import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import { mockPlans } from '@/data/mockPlans';
import { formatCurrency } from '@/utils/helper';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

export default function SettingsScreen() {
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [inactiveAlerts, setInactiveAlerts] = useState(true);
  const [leadTime, setLeadTime] = useState<7 | 3 | 1>(7);

  const SectionHeader = ({ label }: { label: string }) => (
    <Text style={styles.sectionHeader}>{label}</Text>
  );

  const RowItem = ({ icon, label, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void }) => (
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

        {/* Gym Info */}
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

        {/* Notifications */}
        <SectionHeader label="NOTIFICATIONS" />
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Expiry Alerts</Text>
            </View>
            <Switch value={expiryAlerts} onValueChange={setExpiryAlerts} trackColor={{ true: Colors.accent }} thumbColor="#fff" />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="wallet-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Payment Alerts</Text>
            </View>
            <Switch value={paymentAlerts} onValueChange={setPaymentAlerts} trackColor={{ true: Colors.accent }} thumbColor="#fff" />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-remove-outline" size={18} color={Colors.softPink} />
              <Text style={styles.rowLabel}>Inactive Member Alerts</Text>
            </View>
            <Switch value={inactiveAlerts} onValueChange={setInactiveAlerts} trackColor={{ true: Colors.accent }} thumbColor="#fff" />
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
                  <Text style={[styles.segmentText, leadTime === d && styles.segmentTextActive]}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Plans */}
        <SectionHeader label="PLAN MANAGER" />
        <View style={styles.card}>
          {mockPlans.map((plan, i) => (
            <React.Fragment key={plan.id}>
              <View style={styles.planRow}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDuration}>{plan.durationDays} days</Text>
                </View>
                <View style={styles.planRight}>
                  <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                  <TouchableOpacity>
                    <Ionicons name="create-outline" size={18} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
              {i < mockPlans.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
          <TouchableOpacity style={styles.addPlanBtn}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
            <Text style={styles.addPlanText}>Add New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* App */}
        <SectionHeader label="APP" />
        <View style={styles.card}>
          <RowItem icon="information-circle-outline" label="About" onPress={() => {}} />
          <View style={styles.divider} />
          <RowItem icon="code-slash-outline" label="Version" value="1.0.0" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/login')}>
          <Ionicons name="log-out-outline" size={18} color={Colors.expiredRed} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(14),
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
});