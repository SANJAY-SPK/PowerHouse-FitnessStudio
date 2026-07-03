import React, { useState, useMemo, useEffect } from 'react';
import {
  View, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Text, ActivityIndicator, ScrollView,
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

type FilterType = 'all' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PAUSED' | 'PT';

const FILTERS: { key: FilterType; label: string; color: string; bg: string }[] = [
  { key: 'all',      label: 'All',      color: Colors.textPrimary, bg: 'rgba(21,23,61,0.08)'   },
  { key: 'ACTIVE',   label: 'Active',   color: '#15803d',          bg: 'rgba(34,197,94,0.1)'   },
  { key: 'EXPIRING', label: 'Expiring', color: '#92400e',          bg: 'rgba(245,158,11,0.1)'  },
  { key: 'EXPIRED',  label: 'Expired',  color: '#991b1b',          bg: 'rgba(239,68,68,0.1)'   },
  { key: 'PAUSED',   label: 'Paused',   color: '#374151',          bg: 'rgba(156,163,175,0.1)' },
  { key: 'PT',       label: '⚡ PT',    color: '#92400e',          bg: 'rgba(198,134,10,0.1)'  },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: Colors.activeGreen,
  EXPIRING: Colors.expiringAmber,
  EXPIRED: Colors.expiredRed,
  PAUSED: Colors.pausedGray,
};

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

      let matchFilter: boolean;
      if (filter === 'all') {
        matchFilter = true;
      } else if (filter === 'PT') {
        matchFilter = !!m.isPtMember;
      } else {
        matchFilter = m.status === filter;
      }

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
  const expiredCount  = members.filter(m => m.status === 'EXPIRED').length;
  const ptCount       = members.filter(m => m.isPtMember).length;

  return (
    <View style={styles.root}>

      {/* Success Toast */}
      {showSuccessToast && (
        <View style={styles.toast}>
          <View style={styles.toastIconBox}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          </View>
          <Text style={styles.toastText}>
            {params.success === 'updated'
              ? 'Member updated successfully!'
              : 'Member added successfully!'}
          </Text>
        </View>
      )}

      <AppHeader
        title="Members"
        subtitle={`${members.length} total · ${expiringCount} expiring · ${ptCount} PT`}
      />

      <View style={styles.body}>

        {/* Summary strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.activeGreen }]}>
              {members.filter(m => m.status === 'ACTIVE').length}
            </Text>
            <Text style={styles.summaryKey}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.expiringAmber }]}>{expiringCount}</Text>
            <Text style={styles.summaryKey}>Expiring</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.expiredRed }]}>{expiredCount}</Text>
            <Text style={styles.summaryKey}>Expired</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#C6860A' }]}>{ptCount}</Text>
            <Text style={styles.summaryKey}>PT</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips — scrollable */}
        <View style={{ height: verticalScale(36), marginBottom: verticalScale(12) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersWrap}
          >
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  filter === f.key && { backgroundColor: f.bg, borderColor: f.color },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipText,
                  filter === f.key && { color: f.color, fontWeight: '700' },
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* PT summary banner */}
        {filter === 'PT' && ptCount > 0 && (
          <View style={styles.ptBanner}>
            <Ionicons name="fitness" size={14} color="#C6860A" />
            <Text style={styles.ptBannerText}>
              {ptCount} PT Member{ptCount !== 1 ? 's' : ''} · Personal Training
            </Text>
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
                icon={filter === 'PT' ? 'fitness-outline' : 'people-outline'}
                title={filter === 'PT' ? 'No PT members' : 'No members found'}
                subtitle={
                  search
                    ? 'Try a different search term'
                    : filter === 'PT'
                    ? 'Members on PT-Monthly or PT-3 Months plans appear here'
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
  body: { flex: 1, paddingHorizontal: scale(Layout.spacing.lg), paddingTop: verticalScale(12) },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(12),
    shadowColor: '#15173D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(2),
  },
  summaryValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  summaryKey: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
    backgroundColor: Colors.border,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: scale(12),
    height: verticalScale(46),
    gap: scale(8),
    marginBottom: verticalScale(10),
    shadowColor: '#15173D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },

  // Filter chips
  filtersWrap: {
    flexDirection: 'row',
    gap: scale(6),
    paddingRight: scale(20),
  },
  chip: {
    height: verticalScale(30),
    paddingHorizontal: scale(14),
    justifyContent: 'center',
    borderRadius: moderateScale(Layout.radius.full),
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: moderateScale(12),
  },

  // Banners
  ptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: 'rgba(198,134,10,0.08)',
    borderRadius: moderateScale(Layout.radius.sm),
    borderWidth: 1,
    borderColor: 'rgba(198,134,10,0.3)',
    padding: moderateScale(10),
    marginBottom: verticalScale(10),
  },
  ptBannerText: {
    ...Typography.caption,
    color: '#C6860A',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.expiredBg,
    borderRadius: moderateScale(Layout.radius.sm),
    borderWidth: 1,
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

  // Loading
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
  list: { paddingBottom: verticalScale(100) },

  // FAB
  fab: {
    position: 'absolute',
    bottom: verticalScale(114),
    right: scale(20),
    width: moderateScale(58),
    height: moderateScale(58),
    borderRadius: moderateScale(29),
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(10),
    elevation: 8,
    zIndex: 10,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    right: scale(20),
    backgroundColor: Colors.activeGreen,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    zIndex: 999,
    elevation: 8,
    shadowColor: Colors.activeGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastIconBox: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: moderateScale(13), flex: 1 },
});