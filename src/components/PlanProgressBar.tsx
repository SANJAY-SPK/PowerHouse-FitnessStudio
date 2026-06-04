import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Layout, Typography } from '@/constants/theme';
import { getPlanProgress, getDaysRemaining, getStatusColors } from '@/utils/helper';
import { MemberStatus } from '@/types/Members';
import { scale, moderateScale } from '@/constants/scaling';

interface Props {
  startDate: string;
  endDate: string;
  status: MemberStatus;
}

export default function PlanProgressBar({ startDate, endDate, status }: Props) {
  const progress = getPlanProgress(startDate, endDate);
  const daysLeft = getDaysRemaining(endDate);
  const { dot: barColor } = getStatusColors(status);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.label, { color: barColor }]}>
        {daysLeft > 0 ? `${daysLeft} days remaining` : 'Plan expired'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: scale(6) },
  track: {
    height: moderateScale(6),
    backgroundColor: Colors.background,
    borderRadius: Layout.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Layout.radius.full,
  },
  label: {
    ...Typography.caption,
    fontWeight: '500',
  },
});