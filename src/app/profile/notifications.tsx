import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const [classReminders, setClassReminders] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [workoutSummaries, setWorkoutSummaries] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>Notifications</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>Class Reminders</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>Get notified 1 hour before booked classes</ThemedText>
            </View>
            <Switch
              value={classReminders}
              onValueChange={setClassReminders}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>Promotions & Offers</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>Receive updates on new memberships</ThemedText>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>Workout Summaries</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>Weekly emails with your workout stats</ThemedText>
            </View>
            <Switch
              value={workoutSummaries}
              onValueChange={setWorkoutSummaries}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>
        </View>

      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.xs },
  settingsGroup: { backgroundColor: Colors.surface, borderRadius: Layout.radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  settingInfo: { flex: 1, paddingRight: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
});
