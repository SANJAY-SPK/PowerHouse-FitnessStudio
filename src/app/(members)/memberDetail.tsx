import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '@/context/MembersContext';
import { Colors, Typography, Layout } from '@/constants/theme';
import { formatCurrency, formatDate, getStatusColors } from '@/utils/helper';
import AppHeader from '@/components/AppHeader';
import AvatarCircle from '@/components/AvatarCircle';
import StatusBadge from '@/components/StatusBadge';
import PlanProgressBar from '@/components/PlanProgressBar';
import AttendanceBar from '@/components/AttendanceBar';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { members, pauseMember, resumeMember } = useMembers();
  const member = members.find(m => m.id === id);

  if (!member) {
    return (
      <View style={styles.errorRoot}>
        <AppHeader title="Member Details" showBack onBack={() => router.back()} />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.expiredRed} />
          <Text style={styles.errorText}>Member not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColors = getStatusColors(member.status);

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${member.phone}`).catch(() => {});
  };

  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    const formattedPhone = member.phone.startsWith('+91')
      ? member.phone
      : `+91${member.phone}`;
    Linking.openURL(
      `whatsapp://send?phone=${formattedPhone}&text=Hi ${member.name}, this is Power House Fitness Studio.`
    ).catch(() => {
      Linking.openURL(`sms:${member.phone}`).catch(() => {});
    });
  };

  const handleEditProfile = () => {
    router.push({ pathname: '/(members)/memberForm', params: { id: member.id } });
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Member Profile" showBack onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarCircle name={member.name} id={member.id} size={scale(70)} />
            <View style={styles.profileTitleWrap}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberId}>ID: #PH-{member.id.padStart(4, '0')}</Text>
              <StatusBadge status={member.status} />
            </View>
          </View>

          {/* Quick Contact Buttons */}
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
              <Ionicons
                name="mail"
                size={moderateScale(18)}
                color={member.email ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.contactBtnText, !member.email && { color: Colors.textMuted }]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={moderateScale(18)} color="#25D366" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Active Subscription</Text>
            <View style={[styles.planTypeBadge, { backgroundColor: Colors.activeBg }]}>
              <Text style={[styles.planTypeText, { color: Colors.activeText }]}>
                {member.planType.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.planInfoRow}>
              <Text style={styles.planLabel}>Plan Name</Text>
              <Text style={styles.planValue}>{member.planName}</Text>
            </View>
            <View style={styles.planInfoRow}>
              <Text style={styles.planLabel}>Duration</Text>
              <Text style={styles.planValue}>
                {formatDate(member.planStartDate)} - {formatDate(member.planEndDate)}
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
        </View>

        {/* Weekly Attendance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Attendance (Past 7 Days)</Text>
            <View style={styles.visitsBadge}>
              <Text style={styles.visitsText}>{member.totalVisitsThisMonth} Visits This Month</Text>
            </View>
          </View>

          <View style={styles.attendanceWrap}>
            <AttendanceBar attendance={member.attendance} />
          </View>

          {member.lastCheckIn && (
            <Text style={styles.lastCheckInText}>
              Last Checked In: {formatDate(member.lastCheckIn)}
            </Text>
          )}
        </View>

        {/* Personal Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Ionicons name="person-circle-outline" size={moderateScale(18)} color={Colors.accent} />
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Assigned Trainer</Text>
                <Text style={styles.detailValue}>
                  {member.assignedTrainer || 'No Trainer Assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={moderateScale(18)} color={Colors.accent} />
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Joined Date</Text>
                <Text style={styles.detailValue}>{formatDate(member.joinDate)}</Text>
              </View>
            </View>

            {member.dateOfBirth && (
              <View style={styles.detailRow}>
                <Ionicons name="gift-outline" size={moderateScale(18)} color={Colors.accent} />
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Date of Birth</Text>
                  <Text style={styles.detailValue}>{formatDate(member.dateOfBirth)}</Text>
                </View>
              </View>
            )}

            {member.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={moderateScale(18)} color={Colors.accent} />
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{member.address}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment History</Text>

          <View style={styles.paymentList}>
            {member.payments && member.payments.length > 0 ? (
              member.payments.map(payment => (
                <View key={payment.id} style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentPlan}>{payment.planName}</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.date)}
                      {payment.mode ? ` · ${payment.mode.toUpperCase()}` : ''}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <View
                      style={[
                        styles.paymentBadge,
                        {
                          backgroundColor:
                            payment.status === 'paid' ? Colors.activeBg : Colors.expiredBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.paymentBadgeText,
                          {
                            color:
                              payment.status === 'paid' ? Colors.activeText : Colors.expiredText,
                          },
                        ]}
                      >
                        {payment.status === 'paid' ? 'Paid' : 'Due'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noPaymentsText}>No payments recorded.</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Edit Profile — now wired up */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.accent }]}
            activeOpacity={0.8}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={moderateScale(20)} color="#fff" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {member.status === 'paused' ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.activeText }]}
              activeOpacity={0.8}
              onPress={() => resumeMember(member.id)}
            >
              <Ionicons name="play-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.actionButtonText}>Resume Membership</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.pausedText }]}
              activeOpacity={0.8}
              onPress={() => pauseMember(member.id)}
            >
              <Ionicons name="pause-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.actionButtonText}>Pause Membership</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: scale(Layout.spacing.lg),
    gap: verticalScale(14),
    paddingBottom: verticalScale(40),
  },
  errorRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(32),
    gap: verticalScale(16),
  },
  errorText: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: moderateScale(20),
  },
  backBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(Layout.radius.md),
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(16),
    gap: verticalScale(16),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  profileTitleWrap: {
    flex: 1,
    gap: verticalScale(3),
  },
  memberName: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    fontSize: moderateScale(20),
  },
  memberId: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  contactRow: {
    flexDirection: 'row',
    gap: scale(10),
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: verticalScale(14),
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    backgroundColor: Colors.background,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(Layout.radius.sm),
  },
  contactBtnText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  btnDisabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(16),
    gap: verticalScale(14),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
  },
  planTypeBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  planTypeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  planDetails: {
    gap: verticalScale(8),
  },
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
  },
  planValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  progressSection: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: verticalScale(12),
  },
  visitsBadge: {
    backgroundColor: 'rgba(152,37,152,0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(Layout.radius.full),
  },
  visitsText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(11),
  },
  attendanceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(4),
  },
  lastCheckInText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: moderateScale(11),
    marginTop: verticalScale(-2),
  },
  detailsList: {
    gap: verticalScale(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  detailTextWrap: {
    flex: 1,
    gap: verticalScale(1),
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  detailValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  paymentList: {
    gap: verticalScale(10),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  paymentLeft: {
    gap: verticalScale(2),
  },
  paymentPlan: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  paymentDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(11),
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: verticalScale(3),
  },
  paymentAmount: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: moderateScale(13),
  },
  paymentBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(Layout.radius.full),
  },
  paymentBadgeText: {
    ...Typography.label,
    fontWeight: '700',
    fontSize: moderateScale(9),
  },
  noPaymentsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  actionSection: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(6),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(Layout.radius.md),
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
});