import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAddress, Address } from "@/context/AddressContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addresses, addAddress, deleteAddress, setDefaultAddress, updateAddress } = useAddress();
  const { t, language, isRTL } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "المنزل",
    recipientName: "",
    phone: "",
    country: "اليمن",
    city: "",
    street: "",
    building: "",
    notes: "",
    isDefault: false,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function openAddModal() {
    setEditingId(null);
    setForm({
      title: "المنزل",
      recipientName: "",
      phone: "",
      country: "اليمن",
      city: "",
      street: "",
      building: "",
      notes: "",
      isDefault: addresses.length === 0,
    });
    setModalVisible(true);
  }

  function openEditModal(addr: Address) {
    setEditingId(addr.id);
    setForm({
      title: addr.title,
      recipientName: addr.recipientName,
      phone: addr.phone,
      country: addr.country,
      city: addr.city,
      street: addr.street,
      building: addr.building || "",
      notes: addr.notes || "",
      isDefault: addr.isDefault,
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.recipientName.trim() || !form.city.trim() || !form.street.trim() || !form.phone.trim()) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول الإلزامية (الاسم، الجوال، المدينة، والشارع)");
      return;
    }

    if (editingId) {
      await updateAddress(editingId, form);
    } else {
      await addAddress(form);
    }
    setModalVisible(false);
  }

  function confirmDelete(id: string) {
    Alert.alert("حذف العنوان", "هل أنت متأكد من رغبتك في حذف هذا العنوان؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", onPress: () => deleteAddress(id), style: "destructive" },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>عناويني للتوصيل</Text>
        <TouchableOpacity onPress={openAddModal} style={[styles.addTopBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={44} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عناوين محفوظة بعد</Text>
            <Text style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 14, paddingHorizontal: 30 }}>
              أضف عنوان التوصيل الخاص بك لسرعة تأكيد الطلبات وتعبئة العنوان تلقائياً عند الدفع!
            </Text>
            <TouchableOpacity style={[styles.bigAddBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
              <Feather name="plus-circle" size={20} color="#000" />
              <Text style={styles.bigAddBtnText}>إضافة عنوان جديد</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((item) => (
            <View key={item.id} style={[styles.addrCard, { backgroundColor: colors.card, borderColor: item.isDefault ? colors.primary : colors.border }]}>
              <View style={styles.cardTopRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.titleBadge, { backgroundColor: item.isDefault ? colors.primary : colors.muted }]}>
                    <Text style={[styles.titleBadgeText, { color: item.isDefault ? "#000" : colors.foreground }]}>{item.title || "عنوان"}</Text>
                  </View>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Feather name="check-circle" size={12} color="#059669" />
                      <Text style={styles.defaultBadgeText}>العنوان الافتراضي</Text>
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

              <Text style={[styles.recipientText, { color: colors.foreground }]}>{item.recipientName} ({item.phone})</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 4 }}>
                📍 {item.country} - {item.city}، {item.street} {item.building ? "، عمارة: " + item.building : ""}
              </Text>
              {item.notes ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                  ملاحظات: {item.notes}
                </Text>
              ) : null}

              {!item.isDefault && (
                <TouchableOpacity onPress={() => setDefaultAddress(item.id)} style={[styles.setDefaultBtn, { borderColor: colors.border }]}>
                  <Feather name="check" size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>تعيين كعنوان افتراضي</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={{ height: bottomPad + 30 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={[styles.modalHeading, { color: colors.foreground }]}>
                {editingId ? "تعديل العنوان" : "إضافة عنوان توصيل جديد"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 12 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>نوع العنوان (المنزل، العمل...)</Text>
                <TextInput
                  value={form.title}
                  onChangeText={(v) => setForm({ ...form, title: v })}
                  placeholder="مثال: المنزل، المكتب"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>اسم المستلم *</Text>
                <TextInput
                  value={form.recipientName}
                  onChangeText={(v) => setForm({ ...form, recipientName: v })}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>رقم الهاتف للتوصيل *</Text>
                <TextInput
                  value={form.phone}
                  onChangeText={(v) => setForm({ ...form, phone: v })}
                  placeholder="رقم الهاتف للتواصل والتسليم"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>الدولة</Text>
                    <TextInput
                      value={form.country}
                      onChangeText={(v) => setForm({ ...form, country: v })}
                      placeholder="اليمن / السعودية..."
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>المدينة *</Text>
                    <TextInput
                      value={form.city}
                      onChangeText={(v) => setForm({ ...form, city: v })}
                      placeholder="صنعاء، تعز، عدن..."
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>الشارع والحي *</Text>
                <TextInput
                  value={form.street}
                  onChangeText={(v) => setForm({ ...form, street: v })}
                  placeholder="اسم الشارع، الحي، المعلم القريب"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>رقم العمارة / الشقة</Text>
                <TextInput
                  value={form.building}
                  onChangeText={(v) => setForm({ ...form, building: v })}
                  placeholder="اختياري"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />

                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>ملاحظات التوصيل</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm({ ...form, notes: v })}
                  placeholder="مثال: بجوار المسجد، الاتصال قبل الوصول"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editingId ? "حفظ التعديلات" : "إضافة العنوان"}</Text>
            </TouchableOpacity>
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
  bigAddBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  addrCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 6 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  titleBadgeText: { fontWeight: "700", fontSize: 12 },
  defaultBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#05966918", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { color: "#059669", fontSize: 11, fontWeight: "600" },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  recipientText: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  setDefaultBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 12 },
  modalHeading: { fontSize: 18, fontWeight: "700" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, textAlign: "right" },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});