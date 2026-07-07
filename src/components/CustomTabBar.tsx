import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';

const BAR_HEIGHT = verticalScale(62);

// ─── Single tab button ───────────────────────────────────────────────────────
interface TabItemProps {
    route: any;
    descriptor: any;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onLayout: (e: LayoutChangeEvent) => void;
}

function TabItem({ route, descriptor, isFocused, onPress, onLongPress, onLayout }: TabItemProps) {
    const { options } = descriptor;
    const label = (options.title ?? route.name) as string;
    const badge = options.tabBarBadge as string | number | undefined;

    const iconScale = useSharedValue(isFocused ? 1 : 0.92);
    const pressAnim = useSharedValue(1);

    useEffect(() => {
        iconScale.value = withSpring(isFocused ? 1 : 0.92, { damping: 16, stiffness: 200 });
    }, [isFocused]);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value * pressAnim.value }],
    }));

    const iconColor = isFocused ? Colors.accent : Colors.pausedGray;

    const handlePress = () => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
    };

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={() => { pressAnim.value = withSpring(0.88, { damping: 14, stiffness: 300 }); }}
            onPressOut={() => { pressAnim.value = withSpring(1, { damping: 10, stiffness: 220 }); }}
            activeOpacity={1}
            style={styles.tabItem}
            onLayout={onLayout}
        >
            <Animated.View style={[styles.iconSlot, iconStyle]}>
                {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: moderateScale(18) })}
                {badge !== undefined && (
                    <View style={[styles.badge, options.tabBarBadgeStyle]}>
                        <Text style={styles.badgeText} numberOfLines={1}>{badge}</Text>
                    </View>
                )}
            </Animated.View>

            {isFocused && (
                <Text style={[styles.label, { color: iconColor }]} numberOfLines={1}>
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}

// ─── Floating tab bar with sliding indicator ────────────────────────────────
export default function CustomTabBar({ state, descriptors, navigation }: any) {
    const layouts = useRef<{ x: number; width: number }[]>([]);
    const [, forceRender] = useState(0);

    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const measure = (index: number) => (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        layouts.current[index] = { x, width };
        if (index === state.index) {
            indicatorX.value = x;
            indicatorWidth.value = width;
        }
        forceRender((n) => n + 1);
    };

    useEffect(() => {
        const target = layouts.current[state.index];
        if (target) {
            indicatorX.value = withSpring(target.x, { damping: 18, stiffness: 200 });
            indicatorWidth.value = withSpring(target.width, { damping: 18, stiffness: 200 });
        }
    }, [state.index]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value,
    }));

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.barWrap}>
                <BlurView intensity={60} tint="systemMaterialLight" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.barTint]} />

                <Animated.View style={[styles.indicator, indicatorStyle]} />

                <View style={styles.bar}>
                    {state.routes.map((route: any, index: number) => {
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
                                onLayout={measure(index)}
                            />
                        );
                    })}
                </View>
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
    barWrap: {
        width: '90%',
        height: BAR_HEIGHT,
        marginBottom: verticalScale(20),
        borderRadius: BAR_HEIGHT / 2,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: verticalScale(6) },
        shadowOpacity: 0.14,
        shadowRadius: moderateScale(12),
        elevation: 8,
    },
    barTint: {
        backgroundColor: `${Colors.surface}CC`,
    },
    bar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: scale(4),
        borderWidth: moderateScale(1),
        borderColor: 'rgba(21,23,61,0.06)',
        borderRadius: BAR_HEIGHT / 2,
    },
    indicator: {
        position: 'absolute',
        top: verticalScale(4),
        bottom: verticalScale(4),
        backgroundColor: `${Colors.softPink}30`,
        borderRadius: moderateScale(30),
    },
    tabItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(1),
    },
    iconSlot: {
        alignItems: 'center',
        justifyContent: 'center',
        width: moderateScale(22),
        height: moderateScale(22),
    },
    label: {
        fontSize: moderateScale(9),
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    badge: {
        position: 'absolute',
        top: -3,
        right: -8,
        backgroundColor: Colors.expiredRed,
        minWidth: moderateScale(14),
        height: moderateScale(14),
        borderRadius: moderateScale(7),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
        borderWidth: 1.2,
        borderColor: Colors.surface,
    },
    badgeText: {
        color: '#fff',
        fontSize: moderateScale(8),
        fontWeight: '800',
    },
});