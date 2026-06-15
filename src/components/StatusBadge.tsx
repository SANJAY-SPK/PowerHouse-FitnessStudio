import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusColors, getStatusLabel } from '@/utils/helper';
import { Layout, Typography } from '@/constants/theme';
import { moderateScale, verticalScale } from '@/constants/scaling';

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  if (!status) return null;
  const { bg, text } = getStatusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(Layout.radius.full),
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.label,
    fontWeight: '600',
  },
});