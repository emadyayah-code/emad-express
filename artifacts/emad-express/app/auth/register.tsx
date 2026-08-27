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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export interface Country {
  code: string;
  nameAr: string;
  nameEn: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "YE", nameAr: "اليمن", nameEn: "Yemen", dialCode: "+967", flag: "🇾🇪" },
  { code: "SA", nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", nameAr: "الإمارات العربية المتحدة", nameEn: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "EG", nameAr: "مصر", nameEn: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "KW", nameAr: "الكويت", nameEn: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "QA", nameAr: "قطر", nameEn: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "BH", nameAr: "البحرين", nameEn: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "OM", nameAr: "عُمان", nameEn: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "JO", nameAr: "الأردن", nameEn: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "IQ", nameAr: "العراق", nameEn: "Iraq", dialCode: "+964", flag: "🇮🇶" },
  { code: "LB", nameAr: "لبنان", nameEn: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "SY", nameAr: "سوريا", nameEn: "Syria", dialCode: "+963", flag: "🇸🇾" },
  { code: "PS", nameAr: "فلسطين", nameEn: "Palestine", dialCode: "+970", flag: "🇵🇸" },
  { code: "SD", nameAr: "السودان", nameEn: "Sudan", dialCode: "+249", flag: "🇸🇩" },
  { code: "DZ", nameAr: "الجزائر", nameEn: "Algeria", dialCode: "+213", flag: "🇩🇿" },
  { code: "MA", nameAr: "المغرب", nameEn: "Morocco", dialCode: "+212", flag: "🇲🇦" },
  { code: "TN", nameAr: "تونس", nameEn: "Tunisia", dialCode: "+216", flag: "🇹🇳" },
  { code: "LY", nameAr: "ليبيا", nameEn: "Libya", dialCode: "+218", flag: "🇱🇾" },
  { code: "TR", nameAr: "تركيا", nameEn: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "US", nameAr: "الولايات المتحدة", nameEn: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", nameAr: "المملكة المتحدة", nameEn: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", nameAr: "كندا", nameEn: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "DE", nameAr: "ألمانيا", nameEn: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", nameAr: "فرنسا", nameEn: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "CN", nameAr: "الصين", nameEn: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "IN", nameAr: "الهند", nameEn: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "PK", nameAr: "باكستان", nameEn: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "MY", nameAr: "ماليزيا", nameEn: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", nameAr: "إندونيسيا", nameEn: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, loading } = useAuth();
  const { t, language } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default Yemen
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredCountries = searchCountry
    ? COUNTRIES.filter(
        (c) =>
          c.nameAr.includes(searchCountry) ||
          c.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
          c.dialCode.includes(searchCountry)
      )
    : COUNTRIES;

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
      router.replace({ pathname: "/verify-email", params: { email: email.trim().toLowerCase() } } as any);
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
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 24 }}>
            انضم إلينا واستمتع بتجربة تسوق مميزة وسريعة
          </Text>

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
              onPress={() => setCountryModalVisible(true)}
              style={[styles.countryPickerBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
            >
              <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>{selectedCountry.dialCode}</Text>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TextInput
              value={phoneNumber}
              onChangeText={(v) => {
                setPhoneNumber(v);
                setError("");
              }}
              placeholder="رقم الهاتف"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.foreground, textAlign: "left", paddingVertical: 8 }]}
              editable={!loading}
            />
            <Feather name="phone" size={18} color={colors.mutedForeground} />
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
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>إنشاء الحساب</Text>}
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
                      styles.countryRow,
                      {
                        backgroundColor: isSelected ? "#f59e0b18" : "transparent",
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                      setSearchCountry("");
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                      <View>
                        <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>
                          {language === "ar" ? item.nameAr : item.nameEn}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{item.dialCode}</Text>
                      </View>
                    </View>
                    {isSelected && <Feather name="check" size={18} color={colors.primary} />}
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
  brandName: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, textAlign: "right" },
  countryPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef444415",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  error: { color: "#ef4444", fontSize: 13, flex: 1 },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  countryModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  countryModalTitle: { fontSize: 17, fontWeight: "700" },
  countrySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  countrySearchInput: { flex: 1, fontSize: 14, textAlign: "right" },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
});