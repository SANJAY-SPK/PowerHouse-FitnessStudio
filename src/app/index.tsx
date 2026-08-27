import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Pressable, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

export default function HomeScreen() {
  const { user } = useUserStore();

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={{ color: Colors.textMuted }}>
              Welcome back,
            </ThemedText>
            <ThemedText type="title" style={{ color: Colors.primary }}>{user.name}</ThemedText>
          </View>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={32} color={Colors.surface} />
          </View>
        </View>

        {/* Membership Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="crown" size={24} color={Colors.expiringAmber} />
            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>{user.membershipPlan}</ThemedText>
          </View>
          <ThemedText type="small" style={{ color: Colors.textMuted, marginTop: Spacing.sm }}>
            Valid until {user.membershipExpiry}
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionsGrid}>
          
          <Link href="/wod" asChild>
            <Pressable style={styles.actionButton}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.accent }]}>
                <MaterialCommunityIcons name="dumbbell" size={24} color={Colors.surface} />
              </View>
              <ThemedText type="smallBold" style={{ color: Colors.primary }}>WOD</ThemedText>
            </Pressable>
          </Link>

          <Pressable style={styles.actionButton} onPress={() => alert('Check-in successful! Welcome to the gym.')}>
            <View style={[styles.actionIconBg, { backgroundColor: Colors.primary }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color={Colors.surface} />
            </View>
            <ThemedText type="smallBold" style={{ color: Colors.primary }}>Check-in</ThemedText>
          </Pressable>

          <Link href="/book" asChild>
            <Pressable style={styles.actionButton}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.softPink }]}>
                <MaterialCommunityIcons name="calendar-check" size={24} color={Colors.primary} />
              </View>
              <ThemedText type="smallBold" style={{ color: Colors.primary }}>Book</ThemedText>
            </Pressable>
          </Link>

        </View>

        {/* Recent Activity */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Today's Plan
        </ThemedText>
        <Link href={"/workout/2" as any} asChild>
          <Pressable style={styles.card}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <MaterialCommunityIcons name="weight-lifter" size={24} color={Colors.accent} />
              </View>
              <View style={styles.activityDetails}>
                <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>Upper Body Strength</ThemedText>
                <ThemedText type="small" style={{ color: Colors.textMuted }}>18:00 - 19:30 • Zone A</ThemedText>
              </View>
            </View>
          </Pressable>
        </Link>

        {/* Studio Announcements */}
        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          Studio Announcements
        </ThemedText>
        <View style={[styles.card, { backgroundColor: Colors.activeBg, borderColor: Colors.activeGreen }]}>
          <View style={styles.activityRow}>
            <MaterialCommunityIcons name="bullhorn" size={24} color={Colors.activeText} />
            <View style={styles.activityDetails}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.activeText }}>New Yoga Classes</ThemedText>
              <ThemedText type="small" style={{ color: Colors.activeText }}>Join us this weekend for sunrise yoga!</ThemedText>
            </View>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: Colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(152,37,152,0.1)', // accent with opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
  },
});
