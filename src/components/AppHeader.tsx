import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

function IconButton({
  name,
  onPress,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  badge?: number;
}) {
  const scaleVal = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scaleVal.value = withTiming(0.9, { duration: 100 }))}
        onPressOut={() => (scaleVal.value = withTiming(1, { duration: 150 }))}
        style={styles.iconBtn}
        hitSlop={8}
      >
        <Ionicons name={name} size={20} color={Colors.textOnDark} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function AppHeader({
  title,
  subtitle,
  greeting,
  showBack,
  onBack,
  rightIcon,
  rightBadge,
  onRightPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + verticalScale(10) },
      ]}
    >
      <View style={styles.row}>
        {showBack && <IconButton name="arrow-back" onPress={onBack} />}

        <View style={[styles.titleWrap, showBack && { marginLeft: scale(4) }]}>
          {greeting && <Text style={styles.greeting}>{greeting}</Text>}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightIcon && (
          <IconButton name={rightIcon} onPress={onRightPress} badge={rightBadge} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textSubtleOnDark,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
    opacity: 0.85,
    marginBottom: verticalScale(2),
    letterSpacing: 0.2,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textOnDark,
    fontSize: moderateScale(Typography.heading2.fontSize ?? 24),
    letterSpacing: -0.3,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSubtleOnDark,
    fontSize: moderateScale(Typography.caption.fontSize ?? 12),
    marginTop: verticalScale(2),
    opacity: 0.85,
  },
  iconBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: moderateScale(16),
    height: moderateScale(16),
    paddingHorizontal: moderateScale(3),
    borderRadius: moderateScale(8),
    backgroundColor: Colors.expiredRed,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
});