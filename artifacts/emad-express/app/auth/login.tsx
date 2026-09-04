import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";

const logoImg = require("@/assets/images/logo.png");

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, loginWithGoogle, loading } = useAuth();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Google Modal State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [showGooglePass, setShowGooglePass] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogin() {
    if (!email || !password) {
      setError(t.auth.fill_fields);
      return;
    }
    setError("");
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Network") || msg.includes("Failed to fetch")) {
        setError("خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مجدداً.");
      } else {
        setError(msg || t.auth.login_failed);
      }
    }
  }

  function openGoogleModal() {
    setGoogleEmail("");
    setGooglePassword("");
    setGoogleError("");
    setGoogleModalVisible(true);
  }

  async function submitGoogleLogin() {
    if (!googleEmail.trim()) {
      setGoogleError("يرجى إدخال بريد Google الإلكتروني (@gmail.com)");
      return;
    }
    if (!googleEmail.includes("@")) {
      setGoogleError("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }
    if (!googlePassword || googlePassword.length < 6) {
      setGoogleError("يرجى إدخال كلمة المرور (6 أحرف على الأقل)");
      return;
    }

    setGoogleLoading(true);
    setGoogleError("");
    try {
      await loginWithGoogle({
        email: googleEmail.trim().toLowerCase(),
        password: googlePassword,
        name: googleEmail.split("@")[0],
      });
      setGoogleModalVisible(false);
      router.replace("/(tabs)");
    } catch (e: any) {
      setGoogleError(e.message || "فشل تسجيل الدخول بحساب Google");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#0a0a0a", "#1a1000", "#0a0a0a"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="x" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
            <Image source={logoImg} style={{ height: 65, width: "100%", marginBottom: 28 }} resizeMode="contain" />
            <Text style={[styles.subtitle, { color: "#fff" }]}>{t.auth.login_title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 20 }}>{t.auth.login_sub}</Text>

            {/* Google Sign-in Button */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={openGoogleModal}
              disabled={loading}
            >
              <FontAwesome5 name="google" size={18} color="#ea4335" />
              <Text style={[styles.googleBtnText, { color: "#fff" }]}>تسجيل الدخول عبر Google</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={[styles.line, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
              <Text style={styles.orText}>أو</Text>
              <View style={[styles.line, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={18} color={colors.mutedForeground} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.email}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.password}
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPass}
                style={[styles.input, { color: colors.foreground }]}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View style={{ marginBottom: 14, alignSelf: isRTL ? "flex-start" : "flex-end" }}>
              <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
                <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>
                  {(t.auth as any).forgot_password || "نسيت كلمة المرور؟"}
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>{loading ? t.auth.logging_in : t.auth.login_btn}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 }}>
              <Text style={{ color: colors.mutedForeground }}>{t.auth.no_account}</Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>{t.auth.create_account}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Google Sign-in Modal */}
      <Modal visible={googleModalVisible} transparent animationType="fade" onRequestClose={() => setGoogleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.googleModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.googleModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <FontAwesome5 name="google" size={24} color="#ea4335" />
                <View>
                  <Text style={[styles.googleModalTitle, { color: colors.foreground }]}>تسجيل الدخول عبر Google</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>أدخل بيانات بريدك وكلمة المرور</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18, gap: 12 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>بريد Google الإلكتروني (@gmail.com) *</Text>
                <View style={[styles.googleInputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="mail" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={googleEmail}
                    onChangeText={(v) => {
                      setGoogleEmail(v);
                      setGoogleError("");
                    }}
                    placeholder="example@gmail.com"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.modalInput, { color: colors.foreground }]}
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>كلمة مرور الحساب *</Text>
                <View style={[styles.googleInputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="lock" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={googlePassword}
                    onChangeText={(v) => {
                      setGooglePassword(v);
                      setGoogleError("");
                    }}
                    placeholder="كلمة مرور حسابك"
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showGooglePass}
                    style={[styles.modalInput, { color: colors.foreground }]}
                  />
                  <TouchableOpacity onPress={() => setShowGooglePass(!showGooglePass)}>
                    <Feather name={showGooglePass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {googleError ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.error}>{googleError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.googleSubmitBtn, { opacity: googleLoading ? 0.7 : 1 }]}
                onPress={submitGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <FontAwesome5 name="google" size={16} color="#fff" />
                    <Text style={styles.googleSubmitBtnText}>تسجيل الدخول ومتابعة التسوق</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitle: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  googleBtnText: { fontSize: 15, fontWeight: "700" },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 10,
  },
  line: { flex: 1, height: 1 },
  orText: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  inputGroup: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, textAlign: "right" },
  error: { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 },
  loginBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },

  // Google Modal Styles
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)", padding: 16 },
  googleModalCard: { width: "100%", maxWidth: 440, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  googleModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  googleModalTitle: { fontSize: 16, fontWeight: "800" },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  googleInputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  modalInput: { flex: 1, fontSize: 14, textAlign: "right" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", padding: 10, borderRadius: 10 },
  googleSubmitBtn: { backgroundColor: "#ea4335", paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  googleSubmitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});