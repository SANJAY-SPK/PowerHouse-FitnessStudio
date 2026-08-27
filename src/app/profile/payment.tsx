import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';

export default function PaymentScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>Payment Methods</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="credit-card" size={32} color={Colors.primary} />
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ color: Colors.primary }}>Visa ending in 4242</ThemedText>
              <ThemedText type="small" style={{ color: Colors.textMuted }}>Expires 12/28</ThemedText>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.activeGreen} />
          </View>
        </View>

        <Pressable style={styles.addBtn} onPress={() => alert('Add Payment Method Flow')}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.accent} />
          <ThemedText type="defaultSemiBold" style={{ color: Colors.accent, marginLeft: Spacing.sm }}>Add New Card</ThemedText>
        </Pressable>

      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.xs },
  card: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Layout.radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed', borderRadius: Layout.radius.lg },
});
