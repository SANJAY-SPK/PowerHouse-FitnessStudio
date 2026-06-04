import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceDay } from '@/types/Members';
import { Colors, Layout, Typography } from '@/constants/theme';


interface Props {
  attendance: AttendanceDay[];
}

export default function AttendanceBar({ attendance }: Props) {
  return (
    <View style={styles.wrap}>
      {attendance.map((day, i) => {
        const label = new Date(day.date).toLocaleDateString('en-IN', { weekday: 'narrow' });
        return (
          <View key={i} style={styles.dayCol}>
            <View style={[styles.bar, { backgroundColor: day.visited ? Colors.accent : Colors.background }]} />
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: '100%',
    height: 28,
    borderRadius: Layout.radius.sm,
  },
  dayLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
});