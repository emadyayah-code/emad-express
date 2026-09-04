import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Modal, ScrollView, Linking, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, LANGUAGES, Lang } from "@/context/LanguageContext";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/context/CurrencyContext";
import { useAppSettings } from "@/hooks/useAppSettings";

const APP_VERSION = "2.0.0";

function MenuItem({ icon, label, onPress, danger, rightEl }: { icon: string; label: string; onPress: () => void; danger?: boolean; rightEl?: React.ReactNode }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <Feather name={icon as any} size={18} color={danger ? "#ef4444" : colors.mutedForeground} />
      <Text style={[styles.menuLabel, { color: danger ? "#ef4444" : colors.foreground }]}>{label}</Text>
      {rightEl || <Feather name="chevron-left" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

function CurrencyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { currency, setCurrency } = useCurrency();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {language === "ar" ? "اختر العملة" : "Select Currency"}
          </Text>
          {CURRENCIES.map(c => {
            const isSelected = c.code === currency.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[styles.optionRow, { backgroundColor: isSelected ? "#f59e0b22" : "transparent", borderColor: isSelected ? "#f59e0b66" : colors.border }]}
                onPress={() => { setCurrency(c.code as CurrencyCode); onClose(); }}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: isSelected ? "#f59e0b" : colors.muted }]}>
                    <Text style={{ color: isSelected ? "#000" : colors.foreground, fontWeight: "700", fontSize: 14 }}>{c.symbol}</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15 }}>{language === "ar" ? c.nameAr : c.nameEn}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{c.code}</Text>
                  </View>
                </View>
                {isSelected && <Feather name="check" size={18} color="#f59e0b" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function LanguageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {language === "ar" ? "اختر اللغة" : "Select Language"}
          </Text>
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === language;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.optionRow, { backgroundColor: isSelected ? "#f59e0b22" : "transparent", borderColor: isSelected ? "#f59e0b66" : colors.border }]}
                onPress={() => { setLanguage(lang.code as Lang); onClose(); }}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: isSelected ? "#f59e0b" : colors.muted }]}>
                    <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  </View>
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15 }}>{lang.nativeName}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{lang.name}</Text>
                  </View>
                </View>
                {isSelected && <Feather name="check" size={18} color="#f59e0b" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const colors = useColors();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const settings = useAppSettings();
  const isRTL = language === "ar";

  const about = (t as any).about ?? {};
  const address = isRTL ? settings.address_ar : settings.address_en;
  const description = isRTL ? settings.about_ar : settings.about_en;

  async function openWhatsApp() {
    await Linking.openURL(`https://wa.me/${settings.whatsapp_number}`).catch(() => {});
  }
  async function openFacebook() {
    await Linking.openURL(settings.facebook_url).catch(() => {});
  }
  async function openTwitter() {
    await Linking.openURL(settings.twitter_url).catch(() => {});
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View style={[styles.aboutSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={styles.aboutHeader}>
            <View style={[styles.aboutLogo, { backgroundColor: "#f59e0b" }]}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#000" }}>E</Text>
            </View>
            <Text style={[styles.aboutAppName, { color: colors.foreground }]}>{about.title || "Emad Express"}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{about.version || "Version"} {APP_VERSION}</Text>
          </View>

          <Text style={[styles.aboutDesc, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {description}
          </Text>

          <View style={[styles.addressRow, { borderColor: colors.border }]}>
            <Feather name="map-pin" size={16} color="#f59e0b" />
            <Text style={{ color: colors.foreground, fontSize: 14, flex: 1, textAlign: isRTL ? "right" : "left" }}>
              {address}
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {about.contact_us || "Contact Us"}
          </Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#25D366" }]} onPress={openWhatsApp}>
              <Text style={styles.socialIcon}>💬</Text>
              <Text style={styles.socialLabel}>{about.whatsapp || "WhatsApp"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#1877F2" }]} onPress={openFacebook}>
              <Text style={styles.socialIcon}>f</Text>
              <Text style={styles.socialLabel}>{about.facebook || "Facebook"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#222" }]} onPress={openTwitter}>
              <Text style={styles.socialIcon}>𝕏</Text>
              <Text style={styles.socialLabel}>{about.twitter || "Twitter"}</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Policy Link */}
          <TouchableOpacity
            style={[styles.aboutPrivacyBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
            onPress={() => {
              onClose();
              router.push("/privacy-policy");
            }}
          >
            <Feather name="shield" size={16} color="#f59e0b" />
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
              {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
            </Text>
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Copyright Badge */}
          <View style={[styles.copyrightBadge, { backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }]}>
            <Feather name="shield" size={15} color="#f59e0b" />
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
              © جميع الحقوق محفوظة لدى <Text style={{ color: "#f59e0b", fontWeight: "700" }}>emadexpress</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleLogout() {
    if (Platform.OS === "web") {
      if (confirm(t.profile.logout_confirm)) logout();
    } else {
      Alert.alert(t.profile.logout, t.profile.logout_confirm, [
        { text: t.profile.logout_cancel, style: "cancel" },
        { text: t.profile.logout_confirm_yes, onPress: logout, style: "destructive" },
      ]);
    }
  }

  const currentLang = LANGUAGES.find(l => l.code === language);

  const LangBadge = () => (
    <View style={[styles.badge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
        {currentLang?.flag} {currentLang?.nativeName}
      </Text>
    </View>
  );

  const CurrencyBadge = () => (
    <View style={[styles.badge, { backgroundColor: "#f59e0b22", borderColor: "#f59e0b44" }]}>
      <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>
        {currency.symbol} {currency.code}
      </Text>
    </View>
  );

  const GuestView = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
      <View style={[styles.avatarLarge, { backgroundColor: colors.muted }]}>
        <Feather name="user" size={40} color={colors.mutedForeground} />
      </View>
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>{t.profile.welcome}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", paddingHorizontal: 40 }}>
        {t.profile.welcome_sub}
      </Text>
      <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth/login")}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t.profile.login}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/auth/register")}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>{t.profile.register}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => setShowLanguage(true)}>
          <Feather name="globe" size={16} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
            {currentLang?.flag} {currentLang?.nativeName}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => setShowCurrency(true)}>
          <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>{currency.symbol}</Text>
          <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{currency.code}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
        <TouchableOpacity onPress={() => setShowAbout(true)}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t.profile.about || "About Us"}</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.border }}>•</Text>
        <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{t.profile.privacy_policy || (language === "ar" ? "سياسة الخصوصية" : "Privacy Policy")}</Text>
        </TouchableOpacity>
      </View>

      {/* Copyright Badge */}
      <View style={[styles.copyrightBadge, { width: "90%", marginTop: 12, backgroundColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }]}>
        <Feather name="shield" size={15} color="#f59e0b" />
        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
          © جميع الحقوق محفوظة لدى <Text style={{ color: "#f59e0b", fontWeight: "700" }}>emadexpress</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CurrencyModal visible={showCurrency} onClose={() => setShowCurrency(false)} />
      <LanguageModal visible={showLanguage} onClose={() => setShowLanguage(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.profile.title}</Text>
      </View>

      {!user ? <GuestView /> : (
        <ScrollView>
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>{user.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 14 }}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
              {user.phone && <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.phone}</Text>}
            </View>
          </View>

          <View style={{ padding: 16, gap: 10 }}>
            <MenuItem icon="package"     label={t.profile.my_orders}                              onPress={() => router.push("/(tabs)/orders")} />
            <MenuItem icon="rotate-ccw"  label={(t.profile as any).returns || (language === "ar" ? "المرتجعات واسترداد الأموال" : "Returns & Refunds")} onPress={() => router.push("/returns")} />
            <MenuItem icon="heart"       label={t.profile.favorites}                              onPress={() => router.push("/favorites")} />
            <MenuItem icon="map-pin"     label={t.profile.addresses}                              onPress={() => router.push("/addresses")} />
            <MenuItem icon="globe"       label={t.profile.language}   rightEl={<LangBadge />}     onPress={() => setShowLanguage(true)} />
            <MenuItem icon="dollar-sign" label={language === "ar" ? "العملة" : "Currency"} rightEl={<CurrencyBadge />} onPress={() => setShowCurrency(true)} />
            <MenuItem icon="shield"      label={t.profile.privacy_policy || (language === "ar" ? "سياسة الخصوصية" : "Privacy Policy")} onPress={() => router.push("/privacy-policy")} />
            <MenuItem icon="info"        label={(t.profile as any).about || "About Us"}            onPress={() => setShowAbout(true)} />
            <MenuItem icon="log-out"     label={t.profile.logout}                                 onPress={handleLogout} danger />

            {/* Copyright Badge */}
            <View style={[styles.copyrightBadge, { marginTop: 12, backgroundColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }]}>
              <Feather name="shield" size={15} color="#f59e0b" />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                © جميع الحقوق محفوظة لدى <Text style={{ color: "#f59e0b", fontWeight: "700" }}>emadexpress</Text>
              </Text>
            </View>
          </View>
          <View style={{ height: bottomPad + 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 22, fontWeight: "700" },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  loginBtn: { paddingVertical: 12, paddingHorizontal: 36, borderRadius: 12 },
  iconBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  profileCard: { flexDirection: "row", alignItems: "center", margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  userName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  userEmail: { fontSize: 13 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 8 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1 },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aboutSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  copyrightBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  closeBtn: { position: "absolute", top: 24, left: 24, zIndex: 10 },
  aboutHeader: { alignItems: "center", gap: 8, paddingTop: 8 },
  aboutLogo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  aboutAppName: { fontSize: 22, fontWeight: "800" },
  aboutDesc: { fontSize: 14, lineHeight: 22, paddingHorizontal: 4 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, gap: 4 },
  socialIcon: { fontSize: 20, color: "#fff", fontWeight: "900" },
  socialLabel: { color: "#fff", fontSize: 12, fontWeight: "600" },
  aboutPrivacyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
});
