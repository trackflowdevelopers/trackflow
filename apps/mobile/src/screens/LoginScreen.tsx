import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAuth } from '../context/useAuth';
import { colors } from "../theme/colors";
import { TrackFlowLogo } from "../icons/TrackFlowLogo";
import { EmailIcon } from "../icons/EmailIcon";
import { LockIcon } from "../icons/LockIcon";
import { EyeIcon } from "../icons/EyeIcon";
import { loginSchema } from "../schemas/loginSchema";
import type { LoginFormValues } from "../schemas/loginSchema";

export function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const blob1Scale = useRef(new Animated.Value(1)).current;
  const blob2Scale = useRef(new Animated.Value(1)).current;

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

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
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Scale, { toValue: 1.08, duration: 2500, delay: 500, useNativeDriver: true }),
        Animated.timing(blob2Scale, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("validation.emailRequired"),
      });
    }
  }

  const emailBorderColor = emailValue ? colors.primary : colors.border;
  const passwordBorderColor = passwordValue ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View style={[styles.blob1, { transform: [{ scale: blob1Scale }] }]} />
      <Animated.View style={[styles.blob2, { transform: [{ scale: blob2Scale }] }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ translateY }] }]}
          >
            <View style={styles.logoSection}>
              <TrackFlowLogo />
              <Text style={styles.logoWordmark}>
                Track<Text style={styles.logoAccent}>Flow</Text>
              </Text>
              <Text style={styles.logoSubtitle}>Fleet Intelligence Platform</Text>
            </View>

            <View style={styles.headingSection}>
              <Text style={styles.heading}>{t("auth.welcome")}</Text>
              <Text style={styles.subheading}>{t("auth.subtitle")}</Text>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.fieldLabel}>{t("auth.email")}</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputWrapper, { borderColor: emailBorderColor }]}>
                      <EmailIcon />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t("auth.emailPlaceholder")}
                        placeholderTextColor={colors.text3}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <Text style={styles.fieldError}>{t(errors.email.message ?? "")}</Text>
                )}
              </View>

              <View>
                <Text style={styles.fieldLabel}>{t("auth.password")}</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputWrapper, { borderColor: passwordBorderColor }]}>
                      <LockIcon />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="••••••••"
                        placeholderTextColor={colors.text3}
                        secureTextEntry={!showPassword}
                      />
                      <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                        <EyeIcon off={showPassword} />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text style={styles.fieldError}>{t(errors.password.message ?? "")}</Text>
                )}
              </View>

              <Pressable style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>{t("auth.forgot")}</Text>
              </Pressable>
            </View>

            {errors.root && (
              <View style={styles.errorWrapper}>
                <Text style={styles.errorText}>{errors.root.message}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{t("auth.submit")} →</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t("auth.noAccount")}{" "}
                <Text style={styles.footerLink}>{t("auth.register")}</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  blob1: {
    position: "absolute", top: -80, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: colors.primary, opacity: 0.27,
  },
  blob2: {
    position: "absolute", bottom: 60, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.accent, opacity: 0.2,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40,
  },
  logoSection: { marginBottom: 40 },
  logoWordmark: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
    fontSize: 32, fontWeight: "700", color: colors.text,
    letterSpacing: -1, marginTop: 8,
  },
  logoAccent: { color: colors.accent },
  logoSubtitle: {
    fontSize: 12, color: colors.text2, fontWeight: "500",
    marginTop: 4, letterSpacing: 0.7,
  },
  headingSection: { marginBottom: 28 },
  heading: {
    fontSize: 26, fontWeight: "700", color: colors.text,
    lineHeight: 32, marginBottom: 6,
  },
  subheading: { fontSize: 13, color: colors.text2, lineHeight: 20 },
  form: { gap: 12, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11, fontWeight: "600", color: colors.text2,
    letterSpacing: 1, marginBottom: 6,
  },
  fieldError: { fontSize: 11, color: colors.red, marginTop: 4 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.card, borderWidth: 1.5,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  eyeButton: { padding: 2, opacity: 0.7 },
  forgotWrapper: { alignSelf: "flex-end" },
  forgotText: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  errorWrapper: {
    backgroundColor: `${colors.red}22`, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
    borderWidth: 1, borderColor: `${colors.red}44`,
  },
  errorText: { fontSize: 13, color: colors.red, fontWeight: "500" },
  loginButton: {
    width: "100%", paddingVertical: 15, backgroundColor: colors.primary,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.33, shadowRadius: 12, elevation: 8,
  },
  loginButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginButtonText: { fontSize: 15, fontWeight: "700", color: "white", letterSpacing: 0.4 },
  footer: { alignItems: "center", marginTop: "auto", paddingTop: 32 },
  footerText: { fontSize: 12, color: colors.text3 },
  footerLink: { color: colors.accent, fontWeight: "600" },
});
