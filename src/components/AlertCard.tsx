import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert, AlertType } from '@/types/Alert';
import { Colors, Layout, Typography } from '@/constants/theme';
import { formatDateShort } from '@/utils/helper';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

interface Props {
  alert: Alert;
  onAction?: (alert: Alert) => void;
}

function getAlertStyle(type: AlertType) {
  switch (type) {
    case 'expiry':
      return { border: Colors.expiringAmber, icon: 'time-outline' as const, iconBg: Colors.expiringBg, iconColor: Colors.expiringText, action: 'Remind' };
    case 'payment':
      return { border: Colors.expiredRed, icon: 'wallet-outline' as const, iconBg: Colors.expiredBg, iconColor: Colors.expiredText, action: 'Collect' };
    case 'inactive':
      return { border: Colors.accent, icon: 'person-remove-outline' as const, iconBg: '#F3E6F5', iconColor: Colors.accent, action: 'Remind' };
  }
}

export default function AlertCard({ alert, onAction }: Props) {
  const style = getAlertStyle(alert.type);
  return (
    <View style={[styles.card]}>
      <View style={[styles.iconWrap, { backgroundColor: style.iconBg }]}>
        <Ionicons name={style.icon} size={18} color={style.iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{alert.memberName}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        {alert.subMessage && <Text style={styles.sub}>{alert.subMessage}</Text>}
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{formatDateShort(alert.createdAt)}</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction?.(alert)}>
          <Text style={styles.actionText}>{style.action}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: moderateScale(Layout.radius.md),
    padding: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: verticalScale(8),
  },
  iconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: moderateScale(Typography.body.fontSize ?? 14),
  },
  message: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: verticalScale(1),
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  sub: {
    ...Typography.caption,
    color: Colors.expiredText,
    marginTop: verticalScale(1),
    fontWeight: '500',
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
  },
  right: {
    alignItems: 'flex-end',
    gap: verticalScale(6),
  },
  time: {
    ...Typography.label,
    color: Colors.textMuted,
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
  actionBtn: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: moderateScale(Layout.radius.full),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
  },
  actionText: {
    ...Typography.label,
    color: Colors.accent,
    fontWeight: '600',
    fontSize: moderateScale(Typography.label.fontSize ?? 10),
  },
});