import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // TODO: replace with real auth
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoCircle}>
              <Ionicons name="barbell-outline" size={40} color={Colors.accent} />
            </View>
          </View>
          <Text style={styles.appName}>Power House</Text>
          <Text style={styles.appSub}>Fitness Studio Admin</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to manage your studio</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="admin@powerhouse.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>{loading ? 'Signing in…' : 'Login'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Power House FS v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(228,145,201,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(152,37,152,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...Typography.heading1, color: Colors.textOnDark, letterSpacing: 0.5 },
  appSub: { ...Typography.body, color: Colors.textSubtleOnDark, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: 24,
    gap: 14,
  },
  cardTitle: { ...Typography.heading3, color: Colors.textPrimary },
  cardSub: { ...Typography.caption, color: Colors.textMuted, marginTop: -8 },
  fieldWrap: { gap: 6 },
  fieldLabel: { ...Typography.label, color: Colors.textPrimary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -6 },
  forgotText: { ...Typography.caption, color: Colors.accent, fontWeight: '500' },
  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Layout.radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { ...Typography.body, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  footer: { ...Typography.caption, color: 'rgba(228,145,201,0.5)', textAlign: 'center', marginTop: 28 },
});