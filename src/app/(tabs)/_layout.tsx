import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import RoleGate from '@/components/RoleGate';
import CustomTabBar from '@/components/CustomTabBar';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const { unreadCount, fetchUnreadCount } = useAlertStore();
  const { isLoggedIn } = useAuthStore();

  // Fetch real alert count once on mount, then refresh every 5 minutes
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  return (
    <RoleGate allowedRoles={['ADMIN']} fallbackRoute="/(tabs)">
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Flicker fix: match the scene background to the app background
          // so there's no white flash when switching tabs.
          sceneStyle: { backgroundColor: Colors.surface },
          // Smooth cross-fade + slide when switching tabs instead of an
          // instant cut. Requires @react-navigation/bottom-tabs v7+
          // (ships with Expo SDK 52+). Falls back gracefully if unsupported.
          animation: 'shift',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: 'Members',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            title: 'Check In',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'scan' : 'scan-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
            ),
            // Show badge only when there are unread alerts; hide completely when 0
            tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          }}
        />
        <Tabs.Screen
          name="revenue"
          options={{
            title: 'Revenue',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </RoleGate>
  );
}