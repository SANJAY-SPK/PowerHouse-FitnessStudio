import React, { ReactNode, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

type RoleGateProps = {
  allowedRoles: string[];
  fallbackRoute: '/(tabs)' | '/(member-tabs)/qr';
  children: ReactNode;
};

export default function RoleGate({
  allowedRoles,
  fallbackRoute,
  children,
}: RoleGateProps) {
  const { isLoggedIn, role, hasRestored, restoreSession } = useAuthStore();

  useEffect(() => {
    if (!hasRestored) {
      restoreSession();
    }
  }, [hasRestored, restoreSession]);

  useEffect(() => {
    if (!hasRestored) return;

    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (!role || !allowedRoles.includes(role)) {
      router.replace(fallbackRoute);
    }
  }, [allowedRoles, fallbackRoute, hasRestored, isLoggedIn, role]);

  const canRender = hasRestored && isLoggedIn && !!role && allowedRoles.includes(role);

  if (!canRender) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.primary,
        }}
      >
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
