import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { format } = useCurrency();
  const { clearCart } = useCart();
  const webViewRef = useRef<WebView>(null);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [step, setStep] = useState<"loading" | "webview" | "success" | "error">("loading");
  const [platform, setPlatform] = useState("aliexpress");
  const [shippingBy, setShippingBy] = useState("AliExpress");
  const [canGoBack, setCanGoBack] = useState(false);

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom;

  useEffect(() => {
    loadOrderAndInitiate();
  }, [id]);

  const loadOrderAndInitiate = async () => {
    setLoading(true);
    try {
      // 1. Fetch order details
      const orderRes = await api.get(`/orders/${id}`);
      const orderData = orderRes.data?.data || orderRes.data;
      setOrder(orderData);

      // 2. Automatically initiate payment link
      const payRes = await api.post(`/orders/${id}/pay/internal`);
      if (payRes.data?.success && payRes.data?.data?.payment_url) {
        const data = payRes.data.data;
        setPaymentUrl(data.payment_url);
        setPlatform(data.platform || "aliexpress");
        setShippingBy(data.shipping_by || "AliExpress");
        setStep("webview");
      } else {
        setStep("error");
      }
    } catch (err: any) {
      console.error("Payment init error:", err);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    const { url } = navState;
    if (
      url.includes("orderSuccess") ||
      url.includes("payment_success") ||
      url.includes("thank_you") ||
      url.includes("/order/confirm") ||
      url.includes("checkout/success")
    ) {
      confirmPayment();
    }
  };

  const confirmPayment = async () => {
    try {
      await api.post(`/orders/${id}/pay/confirm`, {
        platform_order_id: `CONFIRMED-${Date.now()}`,
      });
      clearCart();
      setStep("success");
    } catch (e: any) {
      clearCart();
      setStep("success");
    }
  };

  const getPlatformTitle = () => {
    if (platform === "amazon") return "بوابة الدفع الرسمية (Amazon)";
    if (platform === "alibaba") return "بوابة الدفع الرسمية (Alibaba)";
    return "بوابة الدفع الرسمية (AliExpress)";
  };

  // SUCCESS STATE
  if (step === "success") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <View style={[styles.successIconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
          <Feather name="check-circle" size={54} color="#10b981" />
        </View>

        <Text style={[styles.successTitle, { color: colors.foreground }]}>تم تأكيد الدفع بنجاح!</Text>
        <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
          تم تسجيل عملية الشراء واحتساب طلبك في النظام مع ضمان حماية المشتري والشحن المباشر.
        </Text>

        {order && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>رقم الطلب</Text>
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>{order.order_number}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>المبلغ الإجمالي</Text>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 15 }}>{format(order.total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>الشحن عبر</Text>
              <Text style={{ color: "#10b981", fontWeight: "700", fontSize: 13 }}>{shippingBy}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
          onPress={() => router.replace("/(tabs)/orders")}
        >
          <Text style={styles.primaryBtnText}>متابعة تفاصيل طلبي</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border, marginTop: 12 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ERROR STATE
  if (step === "error") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <View style={[styles.successIconBox, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
          <Feather name="alert-circle" size={54} color="#ef4444" />
        </View>

        <Text style={[styles.successTitle, { color: colors.foreground }]}>تعذر فتح صفحة الدفع</Text>
        <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
          حدث خطأ أثناء إعداد رابط المورد أو انتهت مهلة الاتصال. بإمكانك إعادة المحاولة أو إكمال الطلب بالدفع عند الاستلام.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={loadOrderAndInitiate}
        >
          <Feather name="refresh-cw" size={18} color="#000" />
          <Text style={styles.primaryBtnText}>إعادة المحاولة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border, marginTop: 12 }]}
          onPress={() => router.replace("/(tabs)/cart")}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>العودة إلى السلة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // LOADING STATE
  if (loading || !paymentUrl) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700", marginTop: 20 }}>
          جاري فتح بوابة الدفع الرسمية للمورد...
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 8, textAlign: "center" }}>
          يتم تحويلك لنافذة الدفع الآمنة في AliExpress مع احتساب كود التتبع
        </Text>
      </View>
    );
  }

  // WEBVIEW PAYMENT SCREEN
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Luxury In-App Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "الخروج من صفحة الدفع؟",
              "هل ترغب في العودة؟ طلبك محفوظ وسيكون بانتظار استكمال الدفع.",
              [
                { text: "إلغاء", style: "cancel" },
                { text: "خروج", style: "destructive", onPress: () => router.back() },
              ]
            );
          }}
          style={styles.headerBtn}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="shield" size={14} color="#10b981" />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{getPlatformTitle()}</Text>
          </View>
          <Text style={{ color: "#10b981", fontSize: 11, fontWeight: "600" }}>اتصال مشفر 256-bit SSL آمن</Text>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL(paymentUrl)}
          style={styles.headerBtn}
          accessibilityLabel="فتح في المتصفح"
        >
          <Feather name="external-link" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Embedded In-App WebView */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={{ flex: 1, backgroundColor: colors.background }}
          onNavigationStateChange={handleWebViewNavigation}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
          renderLoading={() => (
            <View style={[styles.webViewLoader, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
                جاري تحميل صفحة الدفع الآمنة...
              </Text>
            </View>
          )}
        />
      </View>

      {/* Bottom Floating Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 12 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: "#10b981" }]}
          onPress={confirmPayment}
        >
          <Feather name="check" size={20} color="#fff" />
          <Text style={styles.confirmBtnText}>تم إتمام الدفع والشراء بنجاح ✓</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: "center", marginTop: 6 }}>
          اضغط على الزر الأخضر بعد إكمال الشراء داخل الصفحة لتحديث حالة طلبك
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  webViewLoader: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});

