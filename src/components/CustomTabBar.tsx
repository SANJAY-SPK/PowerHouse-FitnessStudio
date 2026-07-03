import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

// ─── Single animated tab button ─────────────────────────────────────────────
interface TabItemProps {
    route: any;
    descriptor: any;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

function TabItem({ route, descriptor, isFocused, onPress, onLongPress }: TabItemProps) {
    const { options } = descriptor;
    const label = (options.title ?? route.name) as string;
    const badge = options.tabBarBadge as string | number | undefined;

    // 0 -> inactive, 1 -> active. Drives pill background, icon scale, and label reveal.
    const focusAnim = useSharedValue(isFocused ? 1 : 0);
    // Independent press feedback so it can layer on top of the focus animation.
    const pressAnim = useSharedValue(1);

    useEffect(() => {
        focusAnim.value = withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 170 });
    }, [isFocused]);

    const pillStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(focusAnim.value, [0, 1], ['transparent', `${Colors.accent}18`]),
        transform: [
            { scale: pressAnim.value },
            { scale: 0.88 + focusAnim.value * 0.12 },
        ],
    }));

    const labelStyle = useAnimatedStyle(() => ({
        opacity: focusAnim.value,
        transform: [{ translateY: (1 - focusAnim.value) * 5 }],
    }));

    const iconColor = isFocused ? Colors.accent : Colors.pausedGray;

    const handlePress = () => {
        Haptics.selectionAsync().catch(() => { });
        onPress();
    };

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={() => { pressAnim.value = withSpring(0.86, { damping: 14, stiffness: 300 }); }}
            onPressOut={() => { pressAnim.value = withSpring(1, { damping: 10, stiffness: 220 }); }}
            activeOpacity={0.9}
            style={styles.tabItem}
        >
            <Animated.View style={[styles.pill, pillStyle]}>
                <View style={styles.iconSlot}>
                    {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: moderateScale(20) })}
                    {badge !== undefined && (
                        <View style={[styles.badge, options.tabBarBadgeStyle]}>
                            <Text style={styles.badgeText} numberOfLines={1}>{badge}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>

            <Animated.Text style={[styles.label, labelStyle, { color: iconColor }]} numberOfLines={1}>
                {label}
            </Animated.Text>
        </TouchableOpacity>
    );
}

// ─── Floating tab bar container ─────────────────────────────────────────────
export default function CustomTabBar({ state, descriptors, navigation }: any) {
    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    const descriptor = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({ type: 'tabLongPress', target: route.key });
                    };

                    return (
                        <TabItem
                            key={route.key}
                            route={route}
                            descriptor={descriptor}
                            isFocused={isFocused}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: Colors.surface,
        width: '90%',
        marginBottom: verticalScale(16),
        borderRadius: moderateScale(22),
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(4),
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: verticalScale(10) },
        shadowOpacity: 0.14,
        shadowRadius: moderateScale(16),
        elevation: 10,
        borderWidth: moderateScale(1),
        borderColor: 'rgba(21,23,61,0.06)',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(3),
    },
    pill: {
        width: moderateScale(44),
        height: moderateScale(32),
        borderRadius: moderateScale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSlot: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: moderateScale(10),
        fontWeight: '700',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: Colors.expiredRed,
        minWidth: moderateScale(16),
        height: moderateScale(16),
        borderRadius: moderateScale(8),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    badgeText: {
        color: '#fff',
        fontSize: moderateScale(9),
        fontWeight: '800',
    },
});