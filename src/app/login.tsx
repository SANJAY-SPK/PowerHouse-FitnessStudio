import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login, restoreSession, isLoading, error, isLoggedIn, role, hasRestored } = useAuthStore();

  useEffect(() => {
    if (!hasRestored) {
      restoreSession();
    }
  }, [hasRestored, restoreSession]);

  // If already logged in (restored session), redirect immediately
  useEffect(() => {
    if (hasRestored && isLoggedIn) {
      redirectByRole(role);
    }
  }, [hasRestored, isLoggedIn, role]);

  const redirectByRole = (role: string | null) => {
    if (role === 'ADMIN') {
      router.replace('/(tabs)');
    } else {
      router.replace('/(member-tabs)/qr');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await login(email.trim(), password);
    } catch {
      // error is already set in the store — shown in UI below
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
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

          {/* Global error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.expiredText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="admin@powerhouse.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn} disabled={isLoading}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginBtn,
              (isLoading || !email || !password) && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Power House FS v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
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
  appName: {
    ...Typography.heading1,
    color: Colors.textOnDark,
    letterSpacing: 0.5,
  },
  appSub: {
    ...Typography.body,
    color: Colors.textSubtleOnDark,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  cardSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.expiredBg,
    borderRadius: Layout.radius.sm,
    borderWidth: 0.5,
    borderColor: Colors.expiredRed,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.expiredText,
    flex: 1,
    fontWeight: '500',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
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
  inputError: {
    borderColor: Colors.expiredRed,
    backgroundColor: Colors.expiredBg,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Layout.radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    ...Typography.caption,
    color: 'rgba(228,145,201,0.5)',
    textAlign: 'center',
    marginTop: 28,
  },
});
