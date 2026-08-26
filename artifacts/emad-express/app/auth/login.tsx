import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
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
  const { login, loading } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogin() {
    if (!email || !password) { setError(t.auth.fill_fields); return; }
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient colors={["#0a0a0a", "#1a1000", "#0a0a0a"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <Image source={logoImg} style={{ height: 65, width: "100%", marginBottom: 28 }} resizeMode="contain" />
          <Text style={[styles.subtitle, { color: "#fff" }]}>{t.auth.login_title}</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 28 }}>{t.auth.login_sub}</Text>

          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              value={email} onChangeText={setEmail}
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
              value={password} onChangeText={setPassword}
              placeholder={t.auth.password}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              style={[styles.input, { color: colors.foreground }]}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
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

          <View style={styles.hint}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Demo: ahmed@example.com / user123</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <Text style={{ color: colors.mutedForeground }}>{t.auth.no_account}</Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>{t.auth.create_account}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitle: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  inputGroup: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, textAlign: "right" },
  error: { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12 },
  loginBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { alignItems: "center", marginTop: 12 },
});
