import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAddress } from "@/context/AddressContext";
import { api } from "@/lib/api";

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { token } = useAuth();
  const { t, isRTL } = useLanguage();
  const { format } = useCurrency();
  const { addresses, defaultAddress } = useAddress();

  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState("aliexpress_direct");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!address && defaultAddress) {
      const formatted = `${defaultAddress.recipientName} (${defaultAddress.dialCode || ""} ${defaultAddress.phone}) - ${defaultAddress.country}، ${
        defaultAddress.state ? `${defaultAddress.state}، ` : ""
      }${defaultAddress.city}، ${defaultAddress.street}${defaultAddress.apartment ? ` (${defaultAddress.apartment})` : ""}${
        defaultAddress.zipCode ? ` - الرمز البريدي: ${defaultAddress.zipCode}` : ""
      }`;
      setAddress(formatted);
    }
  }, [defaultAddress]);

  const PAYMENT_METHODS = [
    {
      key: "aliexpress_direct",
      label: "الدفع المباشر عبر منصة علي إكسبرس (AliExpress)",
      icon: "shield",
      desc: "فتح نافذة الدفع الرسمية للمورد داخل التطبيق لإتمام الطلب بأمان واحتساب عمولة التتبع",
      badges: [
        { label: "AliExpress", bg: "#e11d48" },
        { label: "VISA", bg: "#1a1f71" },
        { label: "Mastercard", bg: "#eb001b" },
        { label: "Mada", bg: "#007a3d" },
      ],
    },
    {
      key: "cod",
      label: t.checkout?.cod || "الدفع عند الاستلام (COD)",
      icon: "truck",
      desc: "الدفع نقداً عند استلام الشحنة لباب منزلك",
      badges: [{ label: "نقداً COD", bg: "#374151" }],
    },
  ];

  const tax = Math.round(total * 0.15);
  const shipping = total > 500 ? 0 : 25;
  const grandTotal = total + tax + shipping;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function placeOrder() {
    if (!address.trim()) {
      Alert.alert("تنبيه", t.checkout?.address_required || "يرجى تحديد عنوان التوصيل أولاً");
      return;
    }

    if (items.length === 0) {
      Alert.alert("تنبيه", "سلة المشتريات فارغة");
      return;
    }

    setLoading(true);
    try {
      const orderRes = await api.post(
        "/orders",
        {
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          })),
          shipping_address: address,
          payment_method: payMethod,
        },
        token
      );

      const orderId =
        (orderRes as any)?.data?.id ||
        (orderRes as any)?.id ||
        (orderRes as any)?.data?.data?.id;

      clearCart();

      if (payMethod === "cod") {
        setSuccess(true);
      } else {
        if (orderId) {
          router.replace(`/payment/${orderId}`);
        } else {
          setSuccess(true);
        }
      }
    } catch (e: any) {
      Alert.alert(t.common?.error || "خطأ", e.response?.data?.message || t.checkout?.error || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <View style={[styles.successIcon, { backgroundColor: "#d1fae5" }]}>
          <Feather name="check" size={48} color="#059669" />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>{t.checkout?.success_title || "تم تأكيد طلبك بنجاح!"}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", paddingHorizontal: 40, marginBottom: 12 }}>
          {t.checkout?.success_msg || "شكراً لتسوقك معنا. سيتم البدء بتجهيز طلبك وشحنه فوراً."}
        </Text>

        <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.primary, marginTop: 24 }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>{t.checkout?.back_home || "العودة للرئيسية"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.checkout.title}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ padding: 16, gap: 16 }}>
          {/* Order Summary */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>ملخص الطلب</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                  {item.name} × {item.quantity}
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
                  {format(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.orderItem}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t.checkout.tax}</Text>
              <Text style={{ color: colors.foreground, fontSize: 13 }}>{format(tax)}</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t.checkout.shipping}</Text>
              <Text style={{ color: shipping === 0 ? "#059669" : colors.foreground, fontSize: 13 }}>
                {shipping === 0 ? t.checkout.free_shipping : format(shipping)}
              </Text>
            </View>
            <View style={[styles.orderItem, { marginTop: 4 }]}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>{t.checkout.grand_total}</Text>
              <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "800" }}>{format(grandTotal)}</Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 0 }]}>{t.checkout.delivery_address}</Text>
              <TouchableOpacity onPress={() => router.push("/addresses")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="plus-circle" size={14} color="#e11d48" />
                <Text style={{ color: "#e11d48", fontSize: 13, fontWeight: "700" }}>+ إضافة / إدارة العناوين</Text>
              </TouchableOpacity>
            </View>

            {addresses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                {addresses.map((a) => {
                  const formatted = `${a.recipientName} (${a.dialCode || ""} ${a.phone}) - ${a.country}، ${
                    a.state ? `${a.state}، ` : ""
                  }${a.city}، ${a.street}${a.apartment ? ` (${a.apartment})` : ""}${
                    a.zipCode ? ` - الرمز البريدي: ${a.zipCode}` : ""
                  }`;
                  const isSelected = address === formatted;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setAddress(formatted)}
                      style={[
                        styles.addrPill,
                        {
                          backgroundColor: isSelected ? "#e11d4815" : colors.muted,
                          borderColor: isSelected ? "#e11d48" : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>{a.countryFlag || "📍"}</Text>
                      <Text style={{ color: isSelected ? "#e11d48" : colors.foreground, fontSize: 12, fontWeight: "700" }}>
                        {a.recipientName} ({a.city})
                      </Text>
                      {isSelected && <Feather name="check" size={13} color="#e11d48" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={t.checkout.address_placeholder}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[styles.addressInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            />
          </View>

          {/* Payment Methods Selection */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.checkout?.payment_method || "طريقة الدفع"}</Text>
            {PAYMENT_METHODS.map((m) => {
              const isSelected = payMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.payOption,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? "rgba(245, 158, 11, 0.08)" : "transparent",
                    },
                  ]}
                  onPress={() => setPayMethod(m.key)}
                >
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14, flex: 1 }}>
                        {m.label}
                      </Text>
                      {/* Brand logos/badges */}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                        {m.badges?.map((b) => (
                          <View
                            key={b.label}
                            style={[
                              styles.miniBadge,
                              { backgroundColor: b.bg },
                            ]}
                          >
                            <Text style={styles.miniBadgeText}>{b.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {m.desc && <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 16 }}>{m.desc}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Direct AliExpress Information Box */}
          {payMethod === "aliexpress_direct" && (
            <View style={[styles.infoBanner, { backgroundColor: "rgba(245, 158, 11, 0.06)", borderColor: "rgba(245, 158, 11, 0.25)" }]}>
              <Feather name="shield" size={18} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13, marginBottom: 2 }}>
                  دفع رسمي ومشفر 100% عبر علي إكسبرس
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>
                  عند الضغط على المتابعة، ستفتح نافذة الدفع الرسمية للمنصة داخل التطبيق لإتمام طلبك مباشرة وحساب العمولة مع حماية كاملة للمشتري.
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ height: bottomPad + 100 }} />
      </ScrollView>

      {/* Checkout Footer Button */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={placeOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name={payMethod === "aliexpress_direct" ? "external-link" : "check-circle"} size={18} color="#000" />
              <Text style={styles.orderBtnText}>
                {payMethod === "aliexpress_direct"
                  ? `المتابعة لإتمام الدفع في علي إكسبرس (${format(grandTotal)}) 🔒`
                  : t.checkout?.place_order || `تأكيد الطلب (${format(grandTotal)})`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 18, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  divider: { height: 1, marginVertical: 10 },
  addrPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  addressInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top", textAlign: "right" },
  payOption: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 5 },
  miniBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  orderBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  orderBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  successIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  homeBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
});