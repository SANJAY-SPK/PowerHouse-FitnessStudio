import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Layout, Typography } from '@/constants/theme';
import { moderateScale, verticalScale } from '@/constants/scaling';

interface Props {
  label: string;
  value: string | number;
  dotColor: string;
  valueColor?: string;
}

export default function StatCard({ label, value, dotColor, valueColor }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: moderateScale(Layout.cardPadding),
    gap: verticalScale(6),
  },
  value: {
    ...Typography.heading2,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: verticalScale(5),
  },
  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
});