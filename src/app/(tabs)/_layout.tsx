import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { scale, moderateScale, verticalScale } from '@/constants/scaling';
import RoleGate from '@/components/RoleGate';
import { useAlertStore } from '@/store/alertStore';

export default function TabLayout() {
  const { unreadCount, fetchUnreadCount } = useAlertStore();

  // Fetch real alert count once on mount, then refresh every 5 minutes
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RoleGate allowedRoles={['ADMIN']} fallbackRoute="/(tabs)">
      <Tabs
        screenOptions={{
          headerShown: false,
          // ── Flicker fix: set the scene background to match the app background
          // so there's no white flash when switching tabs
          sceneStyle: { backgroundColor: Colors.background },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.pausedGray,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: moderateScale(0.5),
            height: verticalScale(62),
            paddingBottom: verticalScale(8),
            paddingTop: verticalScale(4),
          },
          tabBarLabelStyle: {
            fontSize: moderateScale(10),
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: 'Members',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" size={size} color={color} />
            ),
            // Show badge only when there are unread alerts; hide completely when 0
            tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
            tabBarBadgeStyle: {
              backgroundColor: Colors.expiredRed,
              fontSize: moderateScale(10),
              minWidth: moderateScale(18),
              height: moderateScale(18),
              borderRadius: moderateScale(9),
              lineHeight: moderateScale(18),
            },
          }}
        />
        <Tabs.Screen
          name="revenue"
          options={{
            title: 'Revenue',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
    </RoleGate>
  );
}
