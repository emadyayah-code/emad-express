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
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ALL_COUNTRIES, Country } from "@/lib/countries";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, loginWithGoogle, loading } = useAuth();
  const { t, language } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]); // Default Yemen (+967)
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredCountries = searchCountry
    ? ALL_COUNTRIES.filter(
        (c) =>
          c.nameAr.includes(searchCountry) ||
          c.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
          c.dialCode.includes(searchCountry)
      )
    : ALL_COUNTRIES;

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !phoneNumber.trim() || !password) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setError("");

    // Combine dial code with cleaned phone number
    const cleanNumber = phoneNumber.trim().replace(/^0+/, "");
    const fullPhone = `${selectedCountry.dialCode}${cleanNumber}`;

    try {
      await register(name.trim(), email.trim(), fullPhone, password);
      // Directly log in and go to home tabs without OTP
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

  async function handleGoogleAuth() {
    setGoogleLoading(true);
    setError("");
    try {
      // Direct instant Google login/registration
      const demoEmail = `user_${Date.now().toString().slice(-4)}@gmail.com`;
      await loginWithGoogle({
        email: demoEmail,
        name: name.trim() || "مستخدم Google",
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "فشل التسجيل عبر Google");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, padding: 24 }}>
          <Text style={[styles.brandName, { color: colors.primary }]}>عماد إكسبرس</Text>
          <Text style={[styles.subtitle, { color: colors.foreground }]}>إنشاء حساب جديد</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 20 }}>
            انضم إلينا واستمتع بتجربة تسوق مميزة وسريعة
          </Text>

          {/* Quick Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleGoogleAuth}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <FontAwesome5 name="google" size={18} color="#ea4335" />
                <Text style={[styles.googleBtnText, { color: colors.foreground }]}>
                  التسجيل السريع عبر Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>أو عبر البريد الإلكتروني</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          {/* Name Field */}
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError("");
              }}
              placeholder="الاسم الكامل"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              editable={!loading}
            />
          </View>

          {/* Email Field */}
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError("");
              }}
              placeholder="البريد الإلكتروني"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground }]}
              editable={!loading}
            />
          </View>

          {/* Phone Field with Country Selector */}
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 6 }]}>
            <TouchableOpacity
              style={styles.countryPickerBtn}
              onPress={() => {
                setSearchCountry("");
                setCountryModalVisible(true);
              }}
            >
              <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
              <Text style={[styles.dialCodeText, { color: colors.primary }]}>{selectedCountry.dialCode}</Text>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

            <TextInput
              value={phoneNumber}
              onChangeText={(v) => {
                setPhoneNumber(v.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="رقم الهاتف (مثال: 771234567)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.foreground }]}
              editable={!loading}
            />
          </View>

          {/* Password Field */}
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError("");
              }}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.input, { color: colors.foreground }]}
              editable={!loading}
            />
          </View>

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
            {loading ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.btnText}>إنشاء الحساب فوراً</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <Text style={{ color: colors.mutedForeground }}>لديك حساب بالفعل؟</Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Country Selector Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
          <View style={[styles.countryModalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.countryModalTitle, { color: colors.foreground }]}>اختر الدولة / رمز الاتصال</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Search Country */}
            <View style={[styles.countrySearchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={searchCountry}
                onChangeText={setSearchCountry}
                placeholder="ابحث بالاسم أو الرمز الدولي (+967...)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.countrySearchInput, { color: colors.foreground }]}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 380, marginTop: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      {
                        backgroundColor: isSelected ? "#f59e0b15" : "transparent",
                        borderColor: isSelected ? colors.primary : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 8 }}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.countryName, { color: colors.foreground, fontWeight: isSelected ? "700" : "500" }]}>
                        {language === "ar" ? item.nameAr : item.nameEn}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{item.code}</Text>
                    </View>
                    <Text style={[styles.countryDial, { color: colors.primary }]}>{item.dialCode}</Text>
                    {isSelected && <Feather name="check" size={16} color={colors.primary} style={{ marginLeft: 6 }} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandName: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  googleBtnText: { fontSize: 15, fontWeight: "700" },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 10,
  },
  line: { flex: 1, height: 1 },
  orText: { fontSize: 12, fontWeight: "600" },
  inputGroup: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, textAlign: "right" },
  countryPickerBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingHorizontal: 4 },
  dialCodeText: { fontSize: 14, fontWeight: "700" },
  verticalDivider: { width: 1, height: 26, marginHorizontal: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", padding: 10, borderRadius: 10, marginBottom: 12 },
  error: { color: "#ef4444", fontSize: 13, flex: 1, textAlign: "right" },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 6 },
  btnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  // Modal styles
  countryModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: "80%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#666", alignSelf: "center", marginBottom: 12 },
  countryModalTitle: { fontSize: 16, fontWeight: "700" },
  countrySearchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  countrySearchInput: { flex: 1, fontSize: 14, textAlign: "right" },
  countryItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
  countryName: { fontSize: 14 },
  countryDial: { fontSize: 14, fontWeight: "700" },
});