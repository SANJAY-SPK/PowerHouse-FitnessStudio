import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

export default function Index() {
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await restoreSession();
      const { isLoggedIn, role } = useAuthStore.getState();
      if (isLoggedIn) {
        role === 'ADMIN'
          ? router.replace('/(tabs)')
          : router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    };
    init();
  }, []);

  // Show spinner while restoring session
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}
