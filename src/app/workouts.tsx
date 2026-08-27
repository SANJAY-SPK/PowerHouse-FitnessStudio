import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';

const DUMMY_WORKOUTS = [
  { id: 1, title: 'Full Body HIIT', duration: '45 min', intensity: 'High', type: 'Cardio', icon: 'run' },
  { id: 2, title: 'Upper Body Strength', duration: '60 min', intensity: 'Medium', type: 'Strength', icon: 'weight-lifter' },
  { id: 3, title: 'Core Crusher', duration: '30 min', intensity: 'High', type: 'Core', icon: 'yoga' },
  { id: 4, title: 'Recovery Yoga', duration: '45 min', intensity: 'Low', type: 'Flexibility', icon: 'meditation' },
];

export default function WorkoutsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.pageTitle}>Workouts</ThemedText>

        {DUMMY_WORKOUTS.map((workout) => (
          <Link key={workout.id} href={`/workout/${workout.id}` as any} asChild>
            <Pressable style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={workout.icon as any} size={28} color={Colors.accent} />
            </View>
            <View style={styles.detailsContainer}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>{workout.title}</ThemedText>
              <View style={styles.metaRow}>
                <ThemedText type="small" style={{ color: Colors.textMuted }}>{workout.duration}</ThemedText>
                <View style={styles.dot} />
                <ThemedText type="small" style={{ color: Colors.textMuted }}>{workout.intensity}</ThemedText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
            </Pressable>
          </Link>
        ))}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  pageTitle: {
    color: Colors.primary,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(152,37,152,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
});
