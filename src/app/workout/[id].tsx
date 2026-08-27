import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';

const WORKOUT_DB: Record<string, any> = {
  '1': { title: 'Full Body HIIT', duration: '45 min', type: 'Cardio', exercises: ['Burpees', 'Jump Squats', 'Mountain Climbers'] },
  '2': { title: 'Upper Body Strength', duration: '60 min', type: 'Strength', exercises: ['Bench Press', 'Pull-ups', 'Overhead Press'] },
  '3': { title: 'Core Crusher', duration: '30 min', type: 'Core', exercises: ['Plank', 'Crunches', 'Leg Raises'] },
  '4': { title: 'Recovery Yoga', duration: '45 min', type: 'Flexibility', exercises: ['Downward Dog', 'Childs Pose', 'Cobra'] },
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const workout = WORKOUT_DB[id ?? '1'] || WORKOUT_DB['1'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>{workout.title}</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary, marginLeft: Spacing.sm }}>
              {workout.duration}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="dumbbell" size={24} color={Colors.primary} />
            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary, marginLeft: Spacing.sm }}>
              {workout.type}
            </ThemedText>
          </View>
        </View>

        {/* Exercises */}
        <ThemedText type="heading3" style={styles.sectionTitle}>Workout Plan</ThemedText>
        
        {workout.exercises.map((exercise: string, index: number) => (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseIndex}>
              <ThemedText type="smallBold" style={{ color: Colors.surface }}>{index + 1}</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>{exercise}</ThemedText>
          </View>
        ))}

        {/* Start Button */}
        <Pressable style={styles.startButton} onPress={() => alert('Workout Started!')}>
          <ThemedText type="heading3" style={{ color: Colors.surface }}>Start Workout</ThemedText>
        </Pressable>

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
    paddingTop: Spacing.lg,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Layout.radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
