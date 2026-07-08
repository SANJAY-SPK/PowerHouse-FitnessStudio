import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/*
        Three-layer defense against white flash during navigation transitions:

        Layer 1 — SafeAreaProvider background (outermost native shell)
        Layer 2 — This View (JS canvas drawn behind all animating screens)
        Layer 3 — contentStyle on each Stack screen (the screen's own bg)

        All three are set to Colors.background so there is no white surface
        visible at any point during a push, pop, or swipe-back gesture.
      */}
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            // Layer 3: screen content background
            contentStyle: { backgroundColor: Colors.background },
            // slide_from_right on push → naturally reverses on pop (slides out right)
            animation: 'slide_from_right',
            // Enable native swipe-back gesture on both iOS and Android
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            presentation: 'card',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen
            name="(tabs)"
            // Tabs are the "home" — no slide animation entering them,
            // but pop back to them will still animate via gesture.
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="(members)" />
          <Stack.Screen name="settings" />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}