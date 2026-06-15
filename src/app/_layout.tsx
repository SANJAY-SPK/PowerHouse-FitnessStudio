import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, 
            contentStyle: { backgroundColor: Colors.background },
         }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(members)/memberDetail"
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
    </SafeAreaProvider>
  );
}