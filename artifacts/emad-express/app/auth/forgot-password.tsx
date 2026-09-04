import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const isArabic = language === "ar";

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: enter email, 2: enter code & new pass, 3: success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  const codeInputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Countdown timer for resending code
  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Request Reset Code
  const handleRequestCode = async () => {
    if (!email.trim()) {
      setError(isArabic ? "يرجى إدخال البريد الإلكتروني" : "Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      setError(isArabic ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email address");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setStep(2);
      setCountdown(60);
      setTimeout(() => codeInputRef.current?.focus(), 400);
    } catch (err: any) {
      setError(err?.message || (isArabic ? "حدث خطأ أثناء إرسال الكود" : "Failed to send reset code"));
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError("");
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setCountdown(60);
      if (Platform.OS === "web") {
        alert(isArabic ? "تمت إعادة إرسال رمز التحقق بنجاح إلى بريدك ✉️" : "Verification code resent to your email ✉️");
      } else {
        Alert.alert(
          isArabic ? "تم الإرسال ✉️" : "Code Sent ✉️",
          isArabic ? "تمت إعادة إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني" : "Verification code resent successfully to your email"
        );
      }
    } catch (err: any) {
      setError(err?.message || (isArabic ? "تعذر إعادة إرسال الكود" : "Failed to resend code"));
    } finally {
      setResending(false);
    }
  };

  // Step 2: Confirm Reset Password
  const handleResetPassword = async () => {
    if (!code.trim() || code.length < 6) {
      setError(isArabic ? "يرجى إدخال رمز التحقق المكون من 6 أرقام" : "Please enter the 6-digit code");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(isArabic ? "كلمة المرور يجب أن لا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(isArabic ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err?.message || (isArabic ? "رمز التحقق غير صحيح أو منتهي الصلاحية" : "Invalid or expired code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#080a0f", "#140f04", "#080a0f"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Top Bar with Back Button */}
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "700" }}>
              {isArabic ? "استعادة الحساب" : "Account Recovery"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.mainContent, { paddingBottom: bottomPad + 30 }]}>
            {step === 1 && (
              <View style={styles.cardBox}>
                {/* Header Icon */}
                <View style={styles.iconCircle}>
                  <Feather name="key" size={36} color="#f59e0b" />
                </View>

                <Text style={styles.title}>
                  {isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?"}
                </Text>
                <Text style={styles.subtitle}>
                  {isArabic
                    ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق من 6 أرقام لإعادة تعيين كلمة المرور."
                    : "Enter your registered email and we will send you a 6-digit verification code to reset your password."}
                </Text>

                {/* Email Input */}
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Feather name="mail" size={18} color="#f59e0b" />
                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      setError("");
                    }}
                    placeholder={isArabic ? "بريدك الإلكتروني (مثال: user@example.com)" : "Your Email"}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={15} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Submit Request Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#f59e0b", opacity: loading ? 0.7 : 1 }]}
                  onPress={handleRequestCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather name="send" size={16} color="#000" />
                      <Text style={styles.submitBtnText}>
                        {isArabic ? "إرسال رمز التحقق" : "Send Verification Code"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Return to Login */}
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                  <Text style={{ color: "#f59e0b", fontWeight: "700", textAlign: "center", fontSize: 14 }}>
                    {isArabic ? "← العودة لتسجيل الدخول" : "← Back to Login"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.cardBox}>
                {/* Notification Badge */}
                <View style={[styles.emailNoticeBadge, { borderColor: "rgba(245, 158, 11, 0.3)", backgroundColor: "rgba(245, 158, 11, 0.08)" }]}>
                  <Feather name="mail" size={16} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "700", textAlign: isRTL ? "right" : "left" }}>
                      {isArabic ? "تم إرسال رمز التحقق إلى بريدك:" : "Verification code sent to:"}
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.title, { marginTop: 6 }]}>
                  {isArabic ? "أدخل رمز التحقق 🔐" : "Enter Verification Code 🔐"}
                </Text>
                <Text style={styles.subtitle}>
                  {isArabic
                    ? "أدخل الرمز المكوّن من 6 أرقام المرسل إلى بريدك ثم اختر كلمة مرورك الجديدة"
                    : "Enter the 6-digit code sent to your email, then set your new password"}
                </Text>

                {/* Elegant 6-Box OTP Input */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => codeInputRef.current?.focus()}
                  style={styles.otpBoxesContainer}
                >
                  {Array.from({ length: 6 }).map((_, index) => {
                    const digit = code[index] || "";
                    const isFocused = index === code.length;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.otpSingleBox,
                          {
                            borderColor: digit ? "#f59e0b" : isFocused ? "#fbbf24" : "rgba(255,255,255,0.15)",
                            backgroundColor: digit ? "rgba(245, 158, 11, 0.14)" : "rgba(255,255,255,0.04)",
                            shadowColor: "#f59e0b",
                            shadowOpacity: digit ? 0.35 : 0,
                            shadowRadius: 6,
                            elevation: digit ? 3 : 0,
                          },
                        ]}
                      >
                        <Text style={[styles.otpDigitText, { color: digit ? "#f59e0b" : "#fff" }]}>
                          {digit}
                        </Text>
                      </View>
                    );
                  })}
                </TouchableOpacity>

                {/* Hidden Real TextInput to capture keypad */}
                <TextInput
                  ref={codeInputRef}
                  value={code}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/[^0-9]/g, "").slice(0, 6);
                    setCode(cleaned);
                    setError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.hiddenInput}
                  autoFocus
                />

                {/* Countdown / Resend Bar */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Feather name="clock" size={13} color="rgba(255,255,255,0.5)" />
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                        {isArabic ? `إعادة الإرسال بعد ${countdown} ثانية` : `Resend code in ${countdown}s`}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendCode}
                      disabled={resending}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                      <Feather name="refresh-cw" size={13} color="#f59e0b" />
                      <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>
                        {resending ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إعادة إرسال الرمز الآن" : "Resend Code Now")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* New Password Inputs */}
                <View style={{ marginTop: 18, gap: 12 }}>
                  <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Feather name="lock" size={18} color="#f59e0b" />
                    <TextInput
                      value={newPassword}
                      onChangeText={(v) => {
                        setNewPassword(v);
                        setError("");
                      }}
                      placeholder={isArabic ? "كلمة المرور الجديدة (6 أحرف على الأقل)" : "New Password"}
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPass}
                      style={[styles.input, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Feather name="lock" size={18} color="#f59e0b" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(v) => {
                        setConfirmPassword(v);
                        setError("");
                      }}
                      placeholder={isArabic ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showConfirmPass}
                      style={[styles.input, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                      <Feather name={showConfirmPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={15} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Confirm & Save Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#10b981", opacity: loading ? 0.7 : 1, marginTop: 14 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather name="check" size={18} color="#000" />
                      <Text style={styles.submitBtnText}>
                        {isArabic ? "تأكيد وتعيين كلمة المرور" : "Save & Reset Password"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={[styles.cardBox, { alignItems: "center", textAlign: "center", paddingTop: 30 }]}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.4)", width: 90, height: 90 }]}>
                  <Feather name="check-circle" size={48} color="#10b981" />
                </View>

                <Text style={[styles.title, { color: "#10b981", marginTop: 12 }]}>
                  {isArabic ? "تم تعيين كلمة المرور بنجاح!" : "Password Reset Successfully!"}
                </Text>
                <Text style={[styles.subtitle, { marginBottom: 26 }]}>
                  {isArabic
                    ? "تم تحديث كلمة مرور حسابك بأمان. يمكنك الآن تسجيل الدخول والمتابعة."
                    : "Your account password has been updated securely. You can now log in."}
                </Text>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#f59e0b", width: "100%" }]}
                  onPress={() => router.replace("/auth/login")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {isArabic ? "تسجيل الدخول الآن" : "Sign In Now"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardBox: {
    paddingVertical: 10,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  emailNoticeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 14,
  },
  otpSingleBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigitText: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  inputGroup: {
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
});
