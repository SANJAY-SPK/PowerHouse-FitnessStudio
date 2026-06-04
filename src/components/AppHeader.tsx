import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/constants/theme';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

interface Props {
  title: string;
  subtitle?: string;
  greeting?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightBadge?: number;
  onRightPress?: () => void;
}

export default function AppHeader({ title, subtitle, greeting, showBack, onBack, rightIcon, rightBadge, onRightPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + verticalScale(12) }]}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textOnDark} />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          {greeting && <Text style={styles.greeting}>{greeting}</Text>}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightBtn}>
            <Ionicons name={rightIcon} size={24} color={Colors.textOnDark} />
            {rightBadge !== undefined && rightBadge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightBadge > 9 ? '9+' : rightBadge}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(10),
    padding: moderateScale(2),
  },
  titleWrap: {
    flex: 1,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textSubtleOnDark,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
    marginBottom: verticalScale(1),
  },
  title: {
    ...Typography.heading2,
    color: Colors.textOnDark,
    fontSize: moderateScale(Typography.heading2.fontSize ?? 24),
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSubtleOnDark,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
    marginTop: verticalScale(1),
  },
  rightBtn: {
    position: 'relative',
    padding: moderateScale(4),
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.expiredRed,
    borderRadius: moderateScale(8),
    width: moderateScale(16),
    height: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
});