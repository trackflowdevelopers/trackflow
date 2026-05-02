import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Svg, Path, Circle, Rect, Polyline, Line, Polygon } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function TrackFlowLogo() {
  return (
    <Svg width={160} height={52} viewBox="0 0 480 120">
      <Circle cx={32} cy={40} r={9} fill={colors.primary} fillOpacity={0.18} />
      <Circle cx={32} cy={40} r={5} fill={colors.accent} />
      <Path
        d="M32 49 Q32 80 60 80 Q88 80 88 60"
        stroke={colors.accent}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        strokeOpacity={0.5}
      />
      <Circle cx={88} cy={48} r={13} fill={colors.primary} />
      <Circle cx={88} cy={48} r={6} fill="white" />
      <Path d="M88 61 L82 78 Q88 84 94 78 Z" fill={colors.primary} />
    </Svg>
  );
}

function EmailIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={colors.text3}
        strokeWidth={1.8}
      />
      <Polyline
        points="22,6 12,13 2,6"
        stroke={colors.text3}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={colors.text3} strokeWidth={1.8} />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={colors.text3}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface EyeIconProps {
  off: boolean;
}

function EyeIcon({ off }: EyeIconProps) {
  if (off) {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
          stroke={colors.text2}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
          stroke={colors.text2}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Line x1={1} y1={1} x2={23} y2={23} stroke={colors.text2} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={colors.text2}
        strokeWidth={1.8}
      />
      <Circle cx={12} cy={12} r={3} stroke={colors.text2} strokeWidth={1.8} />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={2} width={9} height={9} rx={1} fill="#4285F4" />
      <Rect x={13} y={2} width={9} height={9} rx={1} fill="#34A853" />
      <Rect x={2} y={13} width={9} height={9} rx={1} fill="#FBBC05" />
      <Rect x={13} y={13} width={9} height={9} rx={1} fill="#EA4335" />
    </Svg>
  );
}

export function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const blob1Scale = useRef(new Animated.Value(1)).current;
  const blob2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Scale, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(blob1Scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Scale, { toValue: 1.08, duration: 2500, delay: 500, useNativeDriver: true }),
        Animated.timing(blob2Scale, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Email va parolni kiriting");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  }

  const emailBorderColor = emailFocused || email ? colors.primary : colors.border;
  const passwordBorderColor = passwordFocused || password ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.blob1,
          { transform: [{ scale: blob1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob2,
          { transform: [{ scale: blob2Scale }] },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.logoSection}>
              <TrackFlowLogo />
              <Text style={styles.logoWordmark}>
                Track<Text style={styles.logoAccent}>Flow</Text>
              </Text>
              <Text style={styles.logoSubtitle}>Fleet Intelligence Platform</Text>
            </View>

            <View style={styles.headingSection}>
              <Text style={styles.heading}>Xush kelibsiz 👋</Text>
              <Text style={styles.subheading}>
                Hisobingizga kiring va flotingizni boshqaring
              </Text>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <View style={[styles.inputWrapper, { borderColor: emailBorderColor }]}>
                  <EmailIcon />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="manager@company.uz"
                    placeholderTextColor={colors.text3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>PAROL</Text>
                <View style={[styles.inputWrapper, { borderColor: passwordBorderColor }]}>
                  <LockIcon />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.text3}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <EyeIcon off={showPassword} />
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
              </Pressable>
            </View>

            {error && (
              <View style={styles.errorWrapper}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Kirish →</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>yoki</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
              ]}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText}>Google bilan kirish</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Hisob yo'qmi?{' '}
                <Text style={styles.footerLink}>Ro'yxatdan o'ting</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0.27,
  },
  blob2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 40,
  },
  logoSection: {
    marginBottom: 40,
  },
  logoWordmark: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
    marginTop: 8,
  },
  logoAccent: {
    color: colors.accent,
  },
  logoSubtitle: {
    fontSize: 12,
    color: colors.text2,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.7,
  },
  headingSection: {
    marginBottom: 28,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 32,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  eyeButton: {
    padding: 2,
    opacity: 0.7,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  errorWrapper: {
    backgroundColor: `${colors.red}22`,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.red}44`,
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.33,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    color: colors.text3,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
  },
  googleButtonPressed: {
    opacity: 0.8,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: colors.text3,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '600',
  },
});
