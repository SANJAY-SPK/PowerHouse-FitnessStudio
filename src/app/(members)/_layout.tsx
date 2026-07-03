import { Stack } from 'expo-router';
import RoleGate from '@/components/RoleGate';
import { Colors } from '@/constants/theme';

export default function MembersLayout() {
  return (
    <RoleGate allowedRoles={['ADMIN']} fallbackRoute="/(tabs)">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="memberDetail" />
        <Stack.Screen name="memberForm" />
      </Stack>
    </RoleGate>
  );
}