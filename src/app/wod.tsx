import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';

export default function WODScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>Workout of the Day</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="fire" size={48} color={Colors.expiringAmber} style={styles.heroIcon} />
          <ThemedText type="title" style={{ color: Colors.surface, textAlign: 'center' }}>Hero WOD: Murph</ThemedText>
          <ThemedText type="body" style={{ color: Colors.surface, textAlign: 'center', marginTop: Spacing.sm, opacity: 0.8 }}>
            High Intensity • 45 Min • Full Body
          </ThemedText>
        </View>

        {/* Exercises */}
        <ThemedText type="heading3" style={styles.sectionTitle}>Exercises</ThemedText>
        
        {[
          { name: '1 Mile Run', reps: '1' },
          { name: 'Pull-ups', reps: '100' },
          { name: 'Push-ups', reps: '200' },
          { name: 'Air Squats', reps: '300' },
          { name: '1 Mile Run', reps: '1' },
        ].map((exercise, index) => (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseIndex}>
              <ThemedText type="smallBold" style={{ color: Colors.accent }}>{index + 1}</ThemedText>
            </View>
            <View style={styles.exerciseDetails}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>{exercise.name}</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>{exercise.reps} Reps</ThemedText>
            </View>
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
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIcon: {
    marginBottom: Spacing.md,
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
    backgroundColor: 'rgba(152,37,152,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exerciseDetails: {
    flex: 1,
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
