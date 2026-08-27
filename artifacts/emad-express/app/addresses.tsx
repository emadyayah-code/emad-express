import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAddress, Address } from "@/context/AddressContext";
import { useLanguage } from "@/context/LanguageContext";
import { ALL_COUNTRIES, Country } from "@/lib/countries";

export default function AddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addresses, addAddress, deleteAddress, setDefaultAddress, updateAddress } = useAddress();
  const { language, isRTL } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Selected Country for the Address
  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]); // Yemen default

  // Form Fields matching AliExpress modal screenshot exactly
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredCountries = searchCountry
    ? ALL_COUNTRIES.filter(
        (c) =>
          c.nameAr.includes(searchCountry) ||
          c.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
          c.dialCode.includes(searchCountry)
      )
    : ALL_COUNTRIES;

  function openAddModal() {
    setEditingId(null);
    setSelectedCountry(ALL_COUNTRIES[0]);
    setRecipientName("");
    setPhone("");
    setStreet("");
    setApartment("");
    setStateProvince("");
    setCity("");
    setZipCode("");
    setIsDefault(addresses.length === 0);
    setModalVisible(true);
  }

  function openEditModal(addr: Address) {
    setEditingId(addr.id);
    const countryObj = ALL_COUNTRIES.find((c) => c.nameAr === addr.country || c.code === addr.countryCode) || ALL_COUNTRIES[0];
    setSelectedCountry(countryObj);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setApartment(addr.apartment || "");
    setStateProvince(addr.state || "");
    setCity(addr.city);
    setZipCode(addr.zipCode || "");
    setIsDefault(addr.isDefault);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!recipientName.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال اسم جهة الاتصال.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال رقم الهاتف المحمول.");
      return;
    }
    if (!street.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال اسم الشارع ورقم المنزل/الوحدة السكنية.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال المدينة.");
      return;
    }
    if (!stateProvince.trim()) {
      Alert.alert("تنبيه", "الرجاء إدخال الولاية / المقاطعة / المحافظة.");
      return;
    }

    const payload: Omit<Address, "id"> = {
      title: recipientName.trim(),
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      dialCode: selectedCountry.dialCode,
      country: selectedCountry.nameAr,
      countryCode: selectedCountry.code,
      countryFlag: selectedCountry.flag,
      street: street.trim(),
      apartment: apartment.trim(),
      state: stateProvince.trim(),
      city: city.trim(),
      zipCode: zipCode.trim(),
      isDefault,
    };

    if (editingId) {
      await updateAddress(editingId, payload);
    } else {
      await addAddress(payload);
    }
    setModalVisible(false);
  }

  function confirmDelete(id: string) {
    Alert.alert("حذف العنوان", "هل أنت متأكد من حذف هذا العنوان؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", onPress: () => deleteAddress(id), style: "destructive" },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>عنوان الشحن والتوصيل</Text>
        <TouchableOpacity onPress={openAddModal} style={[styles.addTopBtn, { backgroundColor: "#e11d48" }]}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={44} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عناوين شحن محفوظة بعد</Text>
            <Text style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 14, paddingHorizontal: 30 }}>
              أضف عنوان الشحن الخاص بك ليتم إرساله مباشرةً للمورد الرئيسي لتجهيز شحنتك وتسليمها بسرعة!
            </Text>
            <TouchableOpacity style={[styles.bigAddBtn, { backgroundColor: "#e11d48" }]} onPress={openAddModal}>
              <Feather name="plus-circle" size={20} color="#fff" />
              <Text style={styles.bigAddBtnText}>إضافة عنوان شحن جديد +</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((item) => (
            <View
              key={item.id}
              style={[
                styles.addrCard,
                {
                  backgroundColor: colors.card,
                  borderColor: item.isDefault ? "#e11d48" : colors.border,
                },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{item.countryFlag || "📍"}</Text>
                  <Text style={[styles.recipientText, { color: colors.foreground }]}>
                    {item.recipientName}
                  </Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Feather name="check" size={12} color="#fff" />
                      <Text style={styles.defaultBadgeText}>افتراضي</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                    <Feather name="edit-2" size={15} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)} style={[styles.actionBtn, { backgroundColor: "#ef444418" }]}>
                    <Feather name="trash-2" size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                📞 {item.dialCode || ""} {item.phone}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                🏠 {item.country} - {item.state ? `${item.state}، ` : ""}{item.city}، {item.street}
                {item.apartment ? ` (${item.apartment})` : ""}
                {item.zipCode ? ` - الرمز البريدي: ${item.zipCode}` : ""}
              </Text>

              {!item.isDefault && (
                <TouchableOpacity
                  onPress={() => setDefaultAddress(item.id)}
                  style={[styles.setDefaultBtn, { borderColor: colors.border }]}
                >
                  <Feather name="check" size={14} color="#e11d48" />
                  <Text style={{ color: "#e11d48", fontSize: 13, fontWeight: "600" }}>
                    تعيين كعنوان الشحن الافتراضي
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={{ height: bottomPad + 30 }} />
      </ScrollView>

      {/* AliExpress-Style "إضافة عنوان جديد" Modal Popup */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.aliModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.aliModalHeader}>
              <Text style={[styles.aliModalTitle, { color: colors.foreground }]}>إضافة عنوان جديد</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              <View style={{ padding: 18, gap: 14 }}>
                {/* 1. Country / Region Selector */}
                <View>
                  <Text style={[styles.aliLabel, { color: colors.foreground }]}>البلد/المنطقة</Text>
                  <TouchableOpacity
                    style={[styles.aliCountryBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      setSearchCountry("");
                      setCountryModalVisible(true);
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                      <Text style={[styles.aliCountryText, { color: colors.foreground }]}>{selectedCountry.nameAr}</Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* 2. Contact Information */}
                <View>
                  <Text style={[styles.aliSectionHeader, { color: colors.foreground }]}>معلومات الاتصال</Text>
                  <View style={{ gap: 10, marginTop: 6 }}>
                    {/* Recipient Name */}
                    <View>
                      <TextInput
                        value={recipientName}
                        onChangeText={setRecipientName}
                        placeholder="*اسم جهة الاتصال"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.aliInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      />
                      <Text style={[styles.aliHint, { color: colors.mutedForeground }]}>الرجاء إدخال اسم جهة الاتصال.</Text>
                    </View>

                    {/* Phone Number with Dial Code Prefix Box */}
                    <View style={styles.aliPhoneRow}>
                      <View style={[styles.aliDialCodeBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                        <Text style={[styles.aliDialCodeText, { color: colors.foreground }]}>{selectedCountry.dialCode}</Text>
                      </View>
                      <TextInput
                        value={phone}
                        onChangeText={(v) => setPhone(v.replace(/\D/g, ""))}
                        placeholder="*رقم الهاتف المحمول"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="phone-pad"
                        style={[styles.aliPhoneInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      />
                    </View>
                  </View>
                </View>

                {/* 3. Street Address */}
                <View>
                  <Text style={[styles.aliSectionHeader, { color: colors.foreground }]}>عنوان</Text>
                  <View style={{ gap: 10, marginTop: 6 }}>
                    <TextInput
                      value={street}
                      onChangeText={setStreet}
                      placeholder="*شارع، منزل/شقة/وحدة سكنية"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.aliInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    />

                    <TextInput
                      value={apartment}
                      onChangeText={setApartment}
                      placeholder="شقة، جناح، وحدة، إلخ (اختياري)"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.aliInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    />

                    {/* State / City / Zip Code in 3-column / stacked row */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={stateProvince}
                        onChangeText={setStateProvince}
                        placeholder="*الولاية/المقاطعة"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.aliInput, { flex: 1.2, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      />
                      <TextInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="*مدينة"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.aliInput, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      />
                      <TextInput
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="*الرمز البريدي"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        style={[styles.aliInput, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      />
                    </View>
                  </View>
                </View>

                {/* 4. Set as Default Shipping Address Checkbox */}
                <TouchableOpacity
                  style={styles.aliCheckboxRow}
                  onPress={() => setIsDefault(!isDefault)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.aliCheckbox, { borderColor: isDefault ? "#e11d48" : colors.border, backgroundColor: isDefault ? "#e11d48" : "transparent" }]}>
                    {isDefault && <Feather name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.aliCheckboxLabel, { color: colors.foreground }]}>
                    قم بتعيينه كعنوان الشحن الافتراضي
                  </Text>
                </TouchableOpacity>

                {/* 5. Action Buttons (Confirm Red & Cancel White) */}
                <View style={styles.aliActionsRow}>
                  <TouchableOpacity style={styles.aliConfirmBtn} onPress={handleSave}>
                    <Text style={styles.aliConfirmBtnText}>يتأكد</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.aliCancelBtn, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                    <Text style={[styles.aliCancelBtnText, { color: colors.foreground }]}>يلغي</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Countries Dropdown Picker Modal */}
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
              <Text style={[styles.countryModalTitle, { color: colors.foreground }]}>اختر البلد / المنطقة</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.countrySearchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={searchCountry}
                onChangeText={setSearchCountry}
                placeholder="ابحث بالاسم أو الرمز (+967...)"
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
                        backgroundColor: isSelected ? "#e11d4815" : "transparent",
                        borderColor: isSelected ? "#e11d48" : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 10 }}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.countryName, { color: colors.foreground, fontWeight: isSelected ? "700" : "500" }]}>
                        {language === "ar" ? item.nameAr : item.nameEn}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{item.code}</Text>
                    </View>
                    <Text style={[styles.countryDial, { color: "#e11d48" }]}>{item.dialCode}</Text>
                    {isSelected && <Feather name="check" size={16} color="#e11d48" style={{ marginLeft: 6 }} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addTopBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  bigAddBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, marginTop: 10 },
  bigAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  addrCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 6 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recipientText: { fontSize: 16, fontWeight: "700" },
  defaultBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#e11d48", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  setDefaultBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },

  // AliExpress-Style Modal
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", padding: 16 },
  aliModalCard: { width: "100%", maxWidth: 480, borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  aliModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  aliModalTitle: { fontSize: 16, fontWeight: "800" },
  closeBtn: { padding: 4 },
  aliLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  aliSectionHeader: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  aliCountryBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  aliCountryText: { fontSize: 14, fontWeight: "600" },
  aliInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, textAlign: "right" },
  aliHint: { fontSize: 11, marginTop: 3, marginRight: 2 },
  aliPhoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  aliDialCodeBox: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, justifyContent: "center", alignItems: "center", minWidth: 60 },
  aliDialCodeText: { fontSize: 13, fontWeight: "700" },
  aliPhoneInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, textAlign: "right" },
  aliCheckboxRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 },
  aliCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  aliCheckboxLabel: { fontSize: 13, fontWeight: "600" },
  aliActionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  aliConfirmBtn: { flex: 1, backgroundColor: "#e11d48", paddingVertical: 12, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  aliConfirmBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  aliCancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 12, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  aliCancelBtnText: { fontWeight: "700", fontSize: 15 },

  // Country Modal Styles
  countryModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: "80%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#666", alignSelf: "center", marginBottom: 12 },
  countryModalTitle: { fontSize: 16, fontWeight: "700" },
  countrySearchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  countrySearchInput: { flex: 1, fontSize: 14, textAlign: "right" },
  countryItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
  countryName: { fontSize: 14 },
  countryDial: { fontSize: 14, fontWeight: "700" },
});