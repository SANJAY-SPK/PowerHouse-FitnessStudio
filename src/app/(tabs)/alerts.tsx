import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Alert, AlertType } from '@/types/Alert';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import AlertCard from '@/components/AlertCard';
import EmptyState from '@/components/EmptyState';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
const mockAlerts: Alert[] = [
  { id: 'a1', memberId: '1', memberName: 'Arjun Mehta', type: 'expiry', message: 'Plan expires in 2 days · Monthly Pro', createdAt: '2026-05-28', isRead: false },
  { id: 'a2', memberId: '6', memberName: 'Sneha Patel', type: 'expiry', message: 'Plan expires in 4 days · Quarterly', createdAt: '2026-05-28', isRead: false },
  { id: 'a3', memberId: '4', memberName: 'Riya Nair', type: 'payment', message: 'Payment overdue · Monthly Basic', subMessage: '₹800 pending since May 10', createdAt: '2026-05-28', isRead: false },
  { id: 'a4', memberId: '3', memberName: 'Karthik R', type: 'inactive', message: 'No check-in in 18 days', createdAt: '2026-05-28', isRead: true },
  { id: 'a5', memberId: '5', memberName: 'Vikram Singh', type: 'inactive', message: 'No check-in in 38 days', createdAt: '2026-05-26', isRead: true },
];

type FilterTab = 'all' | AlertType;
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'payment', label: 'Payments' },
  { key: 'inactive', label: 'Inactive' },
];

export default function AlertsScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = mockAlerts.filter(a => activeTab === 'all' || a.type === activeTab);
  const unread = mockAlerts.filter(a => !a.isRead).length;

  return (
    <View style={styles.root}>
      <AppHeader title="Alerts" subtitle={`${unread} unread`} />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        renderItem={({ item }) => <AlertCard alert={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle-outline" title="All clear!" subtitle="No alerts at the moment" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingHorizontal: scale(Layout.spacing.lg),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    position: 'relative',
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: scale(8),
    right: scale(8),
    height: verticalScale(2.5),
    backgroundColor: Colors.accent,
    borderRadius: moderateScale(2),
  },
  list: {
    padding: scale(Layout.spacing.lg),
    paddingBottom: verticalScale(32),
  },
});