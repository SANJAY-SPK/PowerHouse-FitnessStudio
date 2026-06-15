import React, { useState, useMemo, useEffect } from 'react';
import {
  View, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Text, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemberStore } from '@/store/memberStore';
import { Member, MemberStatus } from '@/types/Members';
import { Colors, Typography, Layout } from '@/constants/theme';
import AppHeader from '@/components/AppHeader';
import MemberCard from '@/components/MemberCard';
import EmptyState from '@/components/EmptyState';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

type FilterType = 'all' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PAUSED';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'ACTIVE',   label: 'Active' },
  { key: 'EXPIRING', label: 'Expiring' },
  { key: 'EXPIRED',  label: 'Expired' },
  { key: 'PAUSED',   label: 'Paused' },
];

export default function MembersScreen() {
  const { members, isLoading, error, fetchMembers } = useMemberStore();
  const params = useLocalSearchParams<{ success?: string }>();

  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState<FilterType>('all');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Show toast on navigate-back after add/edit
  useEffect(() => {
    if (params.success === 'created' || params.success === 'updated') {
      setShowSuccessToast(true);
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [params.success]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search);
      const matchFilter = filter === 'all' || m.status === filter;
      return matchSearch && matchFilter;
    });
  }, [members, search, filter]);

  const handlePress = (member: Member) => {
    router.push({
      pathname: '/(members)/memberDetail',
      params: { id: String(member.id) },
    });
  };

  const expiringCount = members.filter(m => m.status === 'EXPIRING').length;

  return (
    <View style={styles.root}>

      {/* Success Toast */}
      {showSuccessToast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>
            {params.success === 'updated'
              ? 'Member updated successfully!'
              : 'Member added successfully!'}
          </Text>
        </View>
      )}

      <AppHeader
        title="Members"
        subtitle={`${members.length} total · ${expiringCount} expiring`}
      />

      <View style={styles.body}>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.accent} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filtersWrap}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.expiredText} />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchMembers()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Loading members…</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={m => String(m.id)}
            renderItem={({ item }) => (
              <MemberCard member={item} onPress={handlePress} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onRefresh={fetchMembers}
            refreshing={isLoading}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No members found"
                subtitle={
                  search
                    ? 'Try a different search term'
                    : filter !== 'all'
                    ? `No ${filter.toLowerCase()} members`
                    : 'Add your first member using the + button'
                }
              />
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(members)/memberForm')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: scale(Layout.spacing.lg) },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: scale(12),
    height: verticalScale(46),
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  filtersWrap: {
    flexDirection: 'row',
    gap: scale(6),
    marginBottom: verticalScale(14),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(Layout.radius.full),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  chipTextActive: { color: Colors.textOnDark },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.expiredBg,
    borderRadius: moderateScale(Layout.radius.sm),
    borderWidth: 0.5,
    borderColor: Colors.expiredRed,
    padding: moderateScale(10),
    marginBottom: verticalScale(10),
  },
  errorBannerText: {
    ...Typography.caption,
    color: Colors.expiredText,
    flex: 1,
  },
  retryText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  list: { paddingBottom: verticalScale(80) },
  fab: {
    position: 'absolute',
    bottom: verticalScale(24),
    right: scale(20),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(8),
    elevation: 6,
    zIndex: 10,
  },
  toast: {
    position: 'absolute',
    top: verticalScale(40),
    left: scale(20),
    right: scale(20),
    backgroundColor: Colors.activeGreen,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    zIndex: 999,
    elevation: 4,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: moderateScale(14) },
});