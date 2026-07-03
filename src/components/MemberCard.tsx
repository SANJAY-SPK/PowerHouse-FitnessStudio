import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Member } from '@/types/Members';
import { Colors, Layout, Typography } from '@/constants/theme';
import { formatDateShort } from '@/utils/helper';
import AvatarCircle from '@/components/AvatarCircle';
import StatusBadge from '@/components/StatusBadge';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

interface Props {
  member: Member;
  onPress: (member: Member) => void;
}

export default function MemberCard({ member, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(member)} activeOpacity={0.7}>
      <AvatarCircle name={member.name} id={member.id} size={44} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          {member.isPtMember && (
            <View style={styles.ptBadge}>
              <Ionicons name="fitness-outline" size={9} color="#fff" />
              <Text style={styles.ptBadgeText}>PT</Text>
            </View>
          )}
        </View>
        <Text style={styles.plan}>{member.planName} · since {formatDateShort(member.joinDate)}</Text>
        {member.assignedTrainer && (
          <Text style={styles.trainer}>
            <Ionicons name="person-outline" size={10} color={Colors.textMuted} /> {member.assignedTrainer}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <StatusBadge status={member.status} />
        <Text style={styles.expiry}>{formatDateShort(member.planEndDate)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(8),
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    flexWrap: 'wrap',
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize),
  },
  ptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#C6860A',
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(1.5),
    borderRadius: moderateScale(4),
  },
  ptBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: moderateScale(8),
    letterSpacing: 0.3,
  },
  plan: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(2),
    fontSize: moderateScale(Typography.caption.fontSize),
  },
  trainer: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(1),
    fontSize: moderateScale(10),
  },
  right: {
    alignItems: 'flex-end',
    gap: verticalScale(4),
  },
  expiry: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.label.fontSize),
  },
});