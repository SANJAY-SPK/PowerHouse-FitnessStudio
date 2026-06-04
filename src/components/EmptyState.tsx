import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '@/constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'checkmark-circle-outline', title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={52} color={Colors.accent} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
    gap: 8,
  },
  title: { ...Typography.heading3, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});