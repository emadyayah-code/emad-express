import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const RETURN_REASONS = [
  { id: "damaged", labelAr: "منتج تالف أو مكسور", labelEn: "Damaged / Broken Item", icon: "alert-triangle" },
  { id: "wrong_item", labelAr: "استلام منتج خاطئ أو مختلف", labelEn: "Wrong Item Received", icon: "x-circle" },
  { id: "defective", labelAr: "خلل مصنعي أو لا يعمل بشكل سليم", labelEn: "Defective / Malfunctioning", icon: "tool" },
  { id: "not_as_described", labelAr: "غير مطابق للصور والمواصفات", labelEn: "Not as Described", icon: "file-text" },
  { id: "changed_mind", labelAr: "لم أعد بحاجة للمنتج / تغيير الرأي", labelEn: "Changed Mind", icon: "help-circle" },
  { id: "other", labelAr: "سبب آخر", labelEn: "Other Reason", icon: "more-horizontal" },
];

const REFUND_METHODS = [
  { id: "original_payment", labelAr: "نفس وسيلة الدفع الأصلية", labelEn: "Original Payment Method", icon: "credit-card" },
  { id: "bank_transfer", labelAr: "تحويل بنكي لحسابي (IBAN)", labelEn: "Bank Transfer (IBAN)", icon: "home" },
  { id: "wallet", labelAr: "إضافة المبلغ إلى رصيد المحفظة", labelEn: "Store Wallet Balance", icon: "pocket" },
];

export default function OrdersScreen() {
  const qc = useQueryClient();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const { format } = useCurrency();

  const isArabic = language === "ar";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Return Modal State
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState<string>("damaged");
  const [selectedMethod, setSelectedMethod] = useState<string>("original_payment");
  const [details, setDetails] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankIban, setBankIban] = useState<string>("");
  const [bankAccountName, setBankAccountName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-orders", token],
    queryFn: () => api.get("/orders", token),
    enabled: !!token,
  });

  const returnMutation = useMutation({
    mutationFn: (body: any) => api.post(`/orders/${selectedOrder.id}/returns`, body, token),
    onSuccess: () => {
      setReturnModalVisible(false);
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["my-returns"] });
      if (Platform.OS === "web") {
        alert(isArabic ? "تم إرسال طلب الإرجاع والاسترداد بنجاح وسيتم مراجعته من الإدارة" : "Return request submitted successfully");
      } else {
        Alert.alert(
          isArabic ? "تم تقديم الطلب" : "Request Submitted",
          isArabic ? "تم إرسال طلب الإرجاع والاسترداد بنجاح وسيتم مراجعته والتواصل معك" : "Your return request has been submitted for review",
          [
            { text: isArabic ? "موافق" : "OK" },
            { text: isArabic ? "عرض طلباتي المرتجعة" : "View Returns", onPress: () => router.push("/returns") },
          ]
        );
      }
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || (isArabic ? "حدث خطأ أثناء تقديم الطلب" : "Failed to submit return request"));
    },
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:    { label: t.orders.status.pending,    color: "#d97706", bg: "#fef3c7" },
    processing: { label: t.orders.status.processing, color: "#2563eb", bg: "#dbeafe" },
    shipped:    { label: t.orders.status.shipped,    color: "#7c3aed", bg: "#ede9fe" },
    delivered:  { label: t.orders.status.delivered,  color: "#059669", bg: "#d1fae5" },
    cancelled:  { label: t.orders.status.cancelled,  color: "#dc2626", bg: "#fee2e2" },
  };

  const openReturnModal = (order: any) => {
    setSelectedOrder(order);
    setSelectedReason("damaged");
    setSelectedMethod(order.payment_method === "cod" ? "bank_transfer" : "original_payment");
    setDetails("");
    setBankName("");
    setBankIban("");
    setBankAccountName("");
    setErrorMsg("");
    setReturnModalVisible(true);
  };

  const submitReturn = () => {
    if (!selectedReason) {
      setErrorMsg(isArabic ? "يرجى تحديد سبب الإرجاع" : "Please select a return reason");
      return;
    }
    if (selectedMethod === "bank_transfer" && !bankIban.trim()) {
      setErrorMsg(isArabic ? "يرجى إدخال رقم الآيبان البنكي (IBAN)" : "Please enter your IBAN number");
      return;
    }
    setErrorMsg("");

    returnMutation.mutate({
      reason: selectedReason,
      details: details.trim(),
      refund_method: selectedMethod,
      bank_name: bankName.trim(),
      bank_iban: bankIban.trim(),
      bank_account_name: bankAccountName.trim(),
      refund_amount: selectedOrder.total,
    });
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t.orders.title}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
          <Feather name="lock" size={52} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            {t.orders.login_required}
          </Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth/login")}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t.profile.login}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const orders = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.orders.title}</Text>
        <TouchableOpacity
          style={[styles.returnsPill, { borderColor: "#f59e0b44", backgroundColor: "rgba(245,158,11,0.08)" }]}
          onPress={() => router.push("/returns")}
        >
          <Feather name="rotate-ccw" size={14} color="#f59e0b" />
          <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "700" }}>
            {isArabic ? "سجل المرتجعات" : "Returns History"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>{t.common.loading}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
          <Feather name="package" size={52} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>{t.orders.empty}</Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/products")}>
            <Text style={{ color: "#000", fontWeight: "800" }}>{t.home.shop_now}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const s = statusConfig[item.status] || { label: item.status, color: "#6b7280", bg: "#f3f4f6" };
            const itemsList = Array.isArray(item.items) ? item.items : [];
            const isDelivered = item.status === "delivered" || item.payment_status === "paid";

            return (
              <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header Row */}
                <View style={[styles.orderHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{isArabic ? "رقم الطلب" : "Order ID"}</Text>
                    <Text style={[styles.orderNum, { color: colors.foreground }]}>{item.order_number}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={{ color: s.color, fontSize: 12, fontWeight: "700" }}>{s.label}</Text>
                  </View>
                </View>

                {/* Items Summary */}
                {itemsList.length > 0 && (
                  <View style={[styles.itemsSummaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {itemsList.slice(0, 3).map((prod: any, idx: number) => (
                      <View key={idx} style={[styles.itemSummaryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                        <Text style={[styles.itemName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
                          {prod.product_name || prod.name}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                          ×{prod.quantity} ({format(prod.price || prod.total)})
                        </Text>
                      </View>
                    ))}
                    {itemsList.length > 3 && (
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: isRTL ? "right" : "left" }}>
                        {isArabic ? `+ ${itemsList.length - 3} منتجات أخرى` : `+ ${itemsList.length - 3} more items`}
                      </Text>
                    )}
                  </View>
                )}

                {/* Date & Total */}
                <View style={[styles.orderFooterRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="calendar" size={13} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {new Date(item.order_date).toLocaleDateString(isArabic ? "ar-EG" : "en-US")}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>{format(item.total)}</Text>
                </View>

                {/* Return & Refund Action Button (Always available for delivered/completed orders) */}
                {isDelivered && (
                  <TouchableOpacity
                    style={[styles.returnActionBtn, { borderColor: "#f59e0b44", backgroundColor: "rgba(245,158,11,0.06)" }]}
                    onPress={() => openReturnModal(item)}
                    activeOpacity={0.8}
                  >
                    <Feather name="rotate-ccw" size={14} color="#f59e0b" />
                    <Text style={[styles.returnActionText, { color: "#f59e0b" }]}>
                      {isArabic ? "طلب إرجاع أو استرداد أموال" : "Request Return / Refund"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Return Request Modal */}
      <Modal visible={returnModalVisible} transparent animationType="slide" onRequestClose={() => setReturnModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />

            <View style={[styles.modalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                  {isArabic ? "طلب إرجاع واسترداد أموال" : "Request Return & Refund"}
                </Text>
                {selectedOrder && (
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: isRTL ? "right" : "left" }}>
                    {selectedOrder.order_number} ({format(selectedOrder.total)})
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setReturnModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Reason Selector */}
              <Text style={[styles.fieldSectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {isArabic ? "1. حدد سبب الإرجاع:" : "1. Select Return Reason:"}
              </Text>
              <View style={styles.reasonsList}>
                {RETURN_REASONS.map((r) => {
                  const isSelected = selectedReason === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonOption,
                        {
                          backgroundColor: isSelected ? "rgba(245, 158, 11, 0.12)" : colors.background,
                          borderColor: isSelected ? "#f59e0b" : colors.border,
                          flexDirection: isRTL ? "row-reverse" : "row",
                        },
                      ]}
                      onPress={() => setSelectedReason(r.id)}
                    >
                      <Feather name={r.icon as any} size={16} color={isSelected ? "#f59e0b" : colors.mutedForeground} />
                      <Text style={[styles.reasonOptionText, { color: isSelected ? colors.foreground : colors.mutedForeground, fontWeight: isSelected ? "700" : "500" }]}>
                        {isArabic ? r.labelAr : r.labelEn}
                      </Text>
                      {isSelected && <Feather name="check" size={16} color="#f59e0b" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Refund Method Selector */}
              <Text style={[styles.fieldSectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left", marginTop: 14 }]}>
                {isArabic ? "2. طريقة استرداد المبلغ:" : "2. Refund Method:"}
              </Text>
              <View style={styles.reasonsList}>
                {REFUND_METHODS.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.reasonOption,
                        {
                          backgroundColor: isSelected ? "rgba(245, 158, 11, 0.12)" : colors.background,
                          borderColor: isSelected ? "#f59e0b" : colors.border,
                          flexDirection: isRTL ? "row-reverse" : "row",
                        },
                      ]}
                      onPress={() => setSelectedMethod(m.id)}
                    >
                      <Feather name={m.icon as any} size={16} color={isSelected ? "#f59e0b" : colors.mutedForeground} />
                      <Text style={[styles.reasonOptionText, { color: isSelected ? colors.foreground : colors.mutedForeground, fontWeight: isSelected ? "700" : "500" }]}>
                        {isArabic ? m.labelAr : m.labelEn}
                      </Text>
                      {isSelected && <Feather name="check" size={16} color="#f59e0b" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bank Details (if bank transfer chosen) */}
              {selectedMethod === "bank_transfer" && (
                <View style={[styles.bankInputsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700", textAlign: isRTL ? "right" : "left" }}>
                    {isArabic ? "بيانات الحساب البنكي لاستلام المبلغ:" : "Bank Details for Refund Transfer:"}
                  </Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder={isArabic ? "اسم البنك (مثال: بنك الكريمي / الراجحي)" : "Bank Name"}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
                  />
                  <TextInput
                    value={bankIban}
                    onChangeText={setBankIban}
                    placeholder={isArabic ? "رقم الآيبان البنكي (IBAN) *" : "IBAN Number *"}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
                  />
                  <TextInput
                    value={bankAccountName}
                    onChangeText={setBankAccountName}
                    placeholder={isArabic ? "اسم صاحب الحساب الثلاثي أو الرباعي" : "Account Holder Full Name"}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
                  />
                </View>
              )}

              {/* Additional Details Textarea */}
              <Text style={[styles.fieldSectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left", marginTop: 14 }]}>
                {isArabic ? "3. تفاصيل أو ملاحظات إضافية (اختياري):" : "3. Additional Details (Optional):"}
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder={isArabic ? "يرجى توضيح سبب الإرجاع أو العيب في المنتج..." : "Explain reason for return..."}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitReturnBtn, { opacity: returnMutation.isPending ? 0.7 : 1 }]}
                onPress={submitReturn}
                disabled={returnMutation.isPending}
              >
                {returnMutation.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="send" size={16} color="#000" />
                    <Text style={styles.submitReturnBtnText}>
                      {isArabic ? "تأكيد وإرسال طلب الإرجاع" : "Submit Return Request"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700" },
  returnsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  loginBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 4 },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  orderHeaderRow: { alignItems: "center", justifyContent: "space-between" },
  orderNum: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  itemsSummaryBox: { padding: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  itemSummaryRow: { alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemName: { fontSize: 12, fontWeight: "600", flex: 1 },
  orderFooterRow: { alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  orderTotal: { fontSize: 15, fontWeight: "800" },
  returnActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  returnActionText: { fontSize: 13, fontWeight: "700" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 6 },
  fieldSectionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  reasonsList: { gap: 8 },
  reasonOption: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonOptionText: { fontSize: 13, flex: 1 },
  bankInputsContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
  },
  modalInput: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  errorText: { color: "#ef4444", fontSize: 12, flex: 1 },
  submitReturnBtn: {
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  submitReturnBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
