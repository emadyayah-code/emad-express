import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, loading } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setError("");
    try {
      await register(form.name.trim(), form.email.trim(), form.phone.trim(), form.password);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("مستخدم بالفعل") || msg.includes("مستخدم")) {
        setError("هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.");
      } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("Network") || msg.includes("Failed to fetch")) {
        setError("خطأ في الاتصال بالإنترنت. تأكد من اتصالك وحاول مجدداً.");
      } else {
        setError(msg || "فشل إنشاء الحساب. حاول مجدداً.");
      }
    }
  }

  const fields = [
    { key: "name", placeholder: "الاسم الكامل", icon: "user", keyboardType: "default", secure: false },
    { key: "email", placeholder: "البريد الإلكتروني", icon: "mail", keyboardType: "email-address", secure: false },
    { key: "phone", placeholder: "رقم الجوال", icon: "phone", keyboardType: "phone-pad", secure: false },
    { key: "password", placeholder: "كلمة المرور (6 أحرف على الأقل)", icon: "lock", keyboardType: "default", secure: true },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={[styles.brandName, { color: colors.primary }]}>عماد إكسبرس</Text>
          <Text style={[styles.subtitle, { color: colors.foreground }]}>إنشاء حساب جديد</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 24 }}>انضم إلينا واستمتع بتجربة تسوق مميزة</Text>

          {fields.map(({ key, placeholder, icon, keyboardType, secure }) => (
            <View key={key} style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: error && !(form as any)[key].trim() ? "#ef4444" : colors.border }]}>
              <Feather name={icon as any} size={18} color={colors.mutedForeground} />
              <TextInput
                value={(form as any)[key]}
                onChangeText={v => { setForm({ ...form, [key]: v }); setError(""); }}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                keyboardType={keyboardType as any}
                autoCapitalize="none"
                secureTextEntry={secure}
                style={[styles.input, { color: colors.foreground }]}
                editable={!loading}
              />
            </View>
          ))}

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>إنشاء الحساب</Text>
            }
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <Text style={{ color: colors.mutedForeground }}>لديك حساب بالفعل؟</Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandName: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  inputGroup: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, textAlign: "right" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ef444415", borderRadius: 10, padding: 10, marginBottom: 12 },
  error: { color: "#ef4444", fontSize: 13, flex: 1 },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
