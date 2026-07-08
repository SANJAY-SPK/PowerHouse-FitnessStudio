import { Stack } from 'expo-router';
import RoleGate from '@/components/RoleGate';
import { Colors } from '@/constants/theme';

export default function MembersLayout() {
  return (
    <RoleGate allowedRoles={['ADMIN']} fallbackRoute="/(tabs)">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          presentation: 'card',
        }}
      >
        <Stack.Screen name="memberDetail" />
        <Stack.Screen name="memberForm" />
      </Stack>
    </RoleGate>
  );
}