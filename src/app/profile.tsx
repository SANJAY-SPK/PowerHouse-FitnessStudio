import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

export default function ProfileScreen() {
  const { user, logout } = useUserStore();

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.xl }}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={48} color={Colors.surface} />
          </View>
          <ThemedText type="heading1" style={{ color: Colors.primary, marginTop: Spacing.md }}>{user.name}</ThemedText>
          <ThemedText type="body" style={{ color: Colors.textMuted }}>{user.email}</ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <ThemedText type="heading2" style={{ color: Colors.primary }}>24</ThemedText>
            <ThemedText type="caption" style={{ color: Colors.textMuted }}>Workouts</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <ThemedText type="heading2" style={{ color: Colors.primary }}>12k</ThemedText>
            <ThemedText type="caption" style={{ color: Colors.textMuted }}>Calories</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <ThemedText type="heading2" style={{ color: Colors.primary }}>3</ThemedText>
            <ThemedText type="caption" style={{ color: Colors.textMuted }}>Months</ThemedText>
          </View>
        </View>

        <ThemedText type="heading3" style={styles.sectionTitle}>Account Settings</ThemedText>
        
        <Link href="/profile/personal-info" asChild>
          <Pressable style={styles.menuItem}>
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={Colors.primary} />
            <ThemedText type="body" style={styles.menuText}>Personal Information</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
          </Pressable>
        </Link>

        <Link href="/profile/payment" asChild>
          <Pressable style={styles.menuItem}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color={Colors.primary} />
            <ThemedText type="body" style={styles.menuText}>Payment Methods</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
          </Pressable>
        </Link>

        <Link href="/profile/notifications" asChild>
          <Pressable style={styles.menuItem}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.primary} />
            <ThemedText type="body" style={styles.menuText}>Notifications</ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
          </Pressable>
        </Link>

        <Pressable style={[styles.menuItem, { marginTop: Spacing.xl }]} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color={Colors.expiredRed} />
          <ThemedText type="body" style={[styles.menuText, { color: Colors.expiredRed }]}>Log Out</ThemedText>
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
    paddingTop: Spacing.xl,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuText: {
    flex: 1,
    marginLeft: Spacing.md,
    color: Colors.primary,
    fontWeight: '500',
  },
});
