import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const statusConfig: Record<string, { labelAr: string; labelEn: string; color: string; bg: string; icon: string }> = {
  pending: {
    labelAr: "قيد المراجعة والتدقيق",
    labelEn: "Under Review",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "clock",
  },
  approved: {
    labelAr: "تمت الموافقة (بانتظار الاستلام)",
    labelEn: "Approved (Awaiting Return)",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "check-circle",
  },
  items_received: {
    labelAr: "تم استلام المنتجات المرتجعة",
    labelEn: "Items Received",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "package",
  },
  refunded: {
    labelAr: "تم إتمام الاسترداد المالي",
    labelEn: "Refund Completed",
    color: "#059669",
    bg: "#d1fae5",
    icon: "credit-card",
  },
  rejected: {
    labelAr: "تم رفض الطلب",
    labelEn: "Rejected",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "x-circle",
  },
};

const reasonMap: Record<string, { ar: string; en: string }> = {
  damaged: { ar: "منتج تالف أو مكسور", en: "Damaged / Broken Item" },
  wrong_item: { ar: "استلام منتج خاطئ أو مختلف", en: "Wrong Item Received" },
  defective: { ar: "خلل مصنعي أو لا يعمل بشكل سليم", en: "Defective / Malfunctioning" },
  not_as_described: { ar: "غير مطابق للصور والمواصفات", en: "Not as Described" },
  changed_mind: { ar: "لم أعد بحاجة للمنتج / تغيير الرأي", en: "Changed Mind" },
  late_delivery: { ar: "تأخر موعد التوصيل", en: "Late Delivery" },
  other: { ar: "سبب آخر", en: "Other Reason" },
};

const refundMethodMap: Record<string, { ar: string; en: string }> = {
  original_payment: { ar: "نفس وسيلة الدفع الأصلية", en: "Original Payment Method" },
  bank_transfer: { ar: "تحويل بنكي مباشر", en: "Bank Transfer" },
  wallet: { ar: "المحفظة الإلكترونية", en: "Wallet" },
};

export default function ReturnsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  const { language, isRTL } = useLanguage();
  const { format } = useCurrency();

  const isArabic = language === "ar";
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-returns", token],
    queryFn: () => api.get("/my-returns", token),
    enabled: !!token,
  });

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isArabic ? "طلبات الإرجاع والاسترداد" : "Returns & Refunds"}
          </Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }}>
          <Feather name="lock" size={48} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700", textAlign: "center" }}>
            {isArabic ? "يجب تسجيل الدخول لعرض طلبات الإرجاع" : "Please login to view returns"}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.actionBtnText}>{isArabic ? "تسجيل الدخول" : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const returnsList = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/profile");
            }
          }}
          style={styles.backBtn}
        >
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isArabic ? "طلبات الإرجاع والاسترداد" : "Returns & Refunds"}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.backBtn}>
          <Feather name="refresh-cw" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
            {isArabic ? "جارٍ تحميل طلبات الإرجاع..." : "Loading returns..."}
          </Text>
        </View>
      ) : returnsList.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
          <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
            <Feather name="rotate-ccw" size={44} color="#f59e0b" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {isArabic ? "لا توجد طلبات إرجاع حالياً" : "No Return Requests Yet"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {isArabic
              ? "يمكنك طلب إرجاع أو استرداد المبلغ لأي طلب مستلم من خلال الذهاب إلى قائمة طلباتي واختيار الطلب المطلوب."
              : "You can request a return or refund for any delivered order from your My Orders screen."}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Feather name="package" size={18} color="#000" />
            <Text style={styles.actionBtnText}>{isArabic ? "الذهاب إلى طلباتي" : "Go to My Orders"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={returnsList}
          keyExtractor={(item: any) => "ret-" + item.id}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const s = statusConfig[item.status] || statusConfig.pending;
            const rInfo = reasonMap[item.reason] || { ar: item.reason, en: item.reason };
            const mInfo = refundMethodMap[item.refund_method] || { ar: item.refund_method, en: item.refund_method };

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header Row: Order Number & Status */}
                <View style={[styles.cardHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                      {isArabic ? "رقم الطلب الأصلي:" : "Order Number:"}
                    </Text>
                    <Text style={[styles.orderNumber, { color: colors.foreground }]}>{item.order_number}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={{ color: s.color, fontSize: 12, fontWeight: "700" }}>
                      {isArabic ? s.labelAr : s.labelEn}
                    </Text>
                  </View>
                </View>

                {/* Return Details */}
                <View style={[styles.infoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {isArabic ? "سبب الإرجاع:" : "Reason:"}
                  </Text>
                  <Text style={[styles.infoValue, { color: "#f59e0b", textAlign: isRTL ? "left" : "right" }]}>
                    {isArabic ? rInfo.ar : rInfo.en}
                  </Text>
                </View>

                {item.details ? (
                  <View style={[styles.detailsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.detailsText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                      {item.details}
                    </Text>
                  </View>
                ) : null}

                {/* Refund Method & Amount */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={[styles.infoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {isArabic ? "مبلغ الاسترداد:" : "Refund Amount:"}
                  </Text>
                  <Text style={[styles.amountValue, { color: "#10b981" }]}>
                    {format(item.refund_amount)}
                  </Text>
                </View>

                <View style={[styles.infoRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    {isArabic ? "طريقة الاسترداد:" : "Refund Method:"}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.foreground, textAlign: isRTL ? "left" : "right" }]}>
                    {isArabic ? mInfo.ar : mInfo.en}
                  </Text>
                </View>

                {item.bank_iban ? (
                  <View style={[styles.bankBox, { backgroundColor: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.2)" }]}>
                    <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "700" }}>
                      {isArabic ? "بيانات التحويل البنكي:" : "Bank Details:"}
                    </Text>
                    {item.bank_name ? (
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>
                        {isArabic ? "البنك: " : "Bank: "} {item.bank_name}
                      </Text>
                    ) : null}
                    <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }}>
                      IBAN: {item.bank_iban}
                    </Text>
                  </View>
                ) : null}

                {/* Admin Notes if provided */}
                {item.admin_notes ? (
                  <View style={[styles.adminNoteCard, { backgroundColor: "rgba(59, 130, 246, 0.08)", borderColor: "rgba(59, 130, 246, 0.25)" }]}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Feather name="info" size={14} color="#3b82f6" />
                      <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "700" }}>
                        {isArabic ? "ملاحظة من إدارة المتجر:" : "Store Administration Note:"}
                      </Text>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20, textAlign: isRTL ? "right" : "left" }}>
                      {item.admin_notes}
                    </Text>
                  </View>
                ) : null}

                {/* Date Footer */}
                <View style={[styles.cardFooter, { flexDirection: isRTL ? "row-reverse" : "row", borderTopColor: colors.border }]}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {new Date(item.created_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  infoRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  detailsBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bankBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  adminNoteCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  cardFooter: {
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  actionBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
});
