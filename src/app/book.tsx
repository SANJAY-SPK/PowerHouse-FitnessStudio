import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';

export default function BookScreen() {
  const router = useRouter();

  const handleBook = (className: string) => {
    alert(`Successfully booked ${className}!`);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>Book a Class</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ThemedText type="heading3" style={styles.dateHeader}>Today, Oct 25</ThemedText>

        {[
          { id: 1, name: 'Sunrise Yoga', time: '06:00 AM', duration: '60 Min', slots: 5, icon: 'yoga' },
          { id: 2, name: 'HIIT Cardio', time: '08:00 AM', duration: '45 Min', slots: 2, icon: 'run' },
          { id: 3, name: 'Power Lifting', time: '12:00 PM', duration: '60 Min', slots: 8, icon: 'weight-lifter' },
          { id: 4, name: 'Zumba Core', time: '06:00 PM', duration: '45 Min', slots: 15, icon: 'human-handsdown' },
        ].map((item) => (
          <View key={item.id} style={styles.classCard}>
            <View style={styles.classIcon}>
              <MaterialCommunityIcons name={item.icon as any} size={28} color={Colors.surface} />
            </View>
            <View style={styles.classDetails}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>{item.name}</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>{item.time} • {item.duration}</ThemedText>
              <ThemedText type="caption" style={{ color: Colors.expiringAmber, marginTop: Spacing.xs }}>
                {item.slots} spots left
              </ThemedText>
            </View>
            <Pressable style={styles.bookBtn} onPress={() => handleBook(item.name)}>
              <ThemedText type="smallBold" style={{ color: Colors.surface }}>Book</ThemedText>
            </Pressable>
          </View>
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
  dateHeader: {
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  classDetails: {
    flex: 1,
  },
  bookBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.radius.full,
  },
});
