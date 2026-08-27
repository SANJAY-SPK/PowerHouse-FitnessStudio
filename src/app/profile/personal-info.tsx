import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth, Layout } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useState } from 'react';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.primary} />
          </Pressable>
          <ThemedText type="heading2" style={{ color: Colors.primary }}>Personal Info</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <ThemedText type="label" style={styles.label}>Full Name</ThemedText>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="label" style={styles.label}>Email Address</ThemedText>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <Pressable style={styles.saveBtn} onPress={() => {
            alert('Settings saved!');
            router.back();
          }}>
            <ThemedText type="heading3" style={{ color: Colors.surface }}>Save Changes</ThemedText>
          </Pressable>
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
  formContainer: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: Layout.radius.lg, borderWidth: 1, borderColor: Colors.border },
  inputGroup: { marginBottom: Spacing.lg },
  label: { color: Colors.primary, marginBottom: Spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Layout.radius.md, backgroundColor: Colors.background },
  inputIcon: { paddingLeft: Spacing.md },
  input: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, color: Colors.primary, fontSize: 14 },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Layout.radius.md, alignItems: 'center', marginTop: Spacing.md },
});
