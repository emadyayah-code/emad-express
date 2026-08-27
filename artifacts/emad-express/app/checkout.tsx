import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
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
  const { t } = useLanguage();
  const { format } = useCurrency();
  const { addresses, defaultAddress } = useAddress();

  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!address && defaultAddress) {
      const formatted = `${defaultAddress.recipientName} (${defaultAddress.phone}) - ${defaultAddress.country}، ${defaultAddress.city}، ${defaultAddress.street}${defaultAddress.building ? `، عمارة: ${defaultAddress.building}` : ""}`;
      setAddress(formatted);
    }
  }, [defaultAddress]);

  const isDropshipping = items.some((i: any) => i.source_platform);

  const PAYMENT_METHODS = [
    { key: "stripe",      label: "بطاقة بنكية / فيزا / ماستركارد", icon: "credit-card", type: "gateway", desc: "Visa / Mastercard / Mada" },
    { key: "google_pay",  label: "Google Pay",            icon: "google-pay",  type: "wallet", desc: "محفظة Google" },
    { key: "apple_pay",   label: "Apple Pay",             icon: "apple",       type: "wallet", desc: "محفظة Apple" },
    { key: "paypal",      label: "PayPal",                icon: "paypal",      type: "gateway", desc: "PayPal الدفع السريع" },
    { key: "cod",         label: t.checkout.cod,          icon: "truck",       type: "cod", desc: "الدفع عند الاستلام" },
  ];

  const tax = Math.round(total * 0.15);
  const shipping = total > 500 ? 0 : 25;
  const grandTotal = total + tax + shipping;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function placeOrder() {
    if (!address.trim()) {
      Alert.alert("تنبيه", t.checkout.address_required);
      return;
    }
    setLoading(true);
    try {
      // Create order first
      const methodKey = payMethod === "stripe" ? "card" : payMethod;
      const orderRes = await api.post("/orders", {
        items: items.map(i => ({ product_id: i.id, product_name: i.name, quantity: i.quantity, price: i.price, total: i.price * i.quantity })),
        shipping_address: address,
        payment_method: methodKey,
      }, token);

      const orderId = orderRes?.data?.id || orderRes?.data?.data?.id || orderRes?.id;

      // For Dropshipping or Split Payment, navigate to payment screen
      if (orderId && (payMethod === "split" || payMethod === "webview" || isDropshipping)) {
        router.push({
          pathname: "/payment/[id]",
          params: { id: orderId }
        });
        setLoading(false);
        return;
      }

      clearCart();
      setSuccess(true);
    } catch (e: any) {
      Alert.alert(t.common.error, e.response?.data?.message || t.checkout.error);
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
        <Text style={[styles.successTitle, { color: colors.foreground }]}>{t.checkout.success_title}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", paddingHorizontal: 40, marginBottom: 30 }}>
          {t.checkout.success_msg}
        </Text>
        <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t.checkout.back_home}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.checkout.title}</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 16 }}>
          {/* Order Summary */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>ملخص الطلب</Text>
            {items.map(item => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{item.name} × {item.quantity}</Text>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{format(item.price * item.quantity)}</Text>
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

          {/* Address */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 0 }]}>{t.checkout.delivery_address}</Text>
              <TouchableOpacity onPress={() => router.push("/addresses")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="map-pin" size={13} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>إدارة عناويني</Text>
              </TouchableOpacity>
            </View>

            {addresses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                {addresses.map((a) => {
                  const formatted = `${a.recipientName} (${a.phone}) - ${a.country}، ${a.city}، ${a.street}${a.building ? `، عمارة: ${a.building}` : ""}`;
                  const isSelected = address === formatted;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setAddress(formatted)}
                      style={[
                        styles.addrPill,
                        {
                          backgroundColor: isSelected ? "#f59e0b20" : colors.muted,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Feather name={isSelected ? "check-circle" : "map-pin"} size={13} color={isSelected ? colors.primary : colors.mutedForeground} />
                      <Text style={{ color: isSelected ? colors.primary : colors.foreground, fontSize: 12, fontWeight: "600" }}>
                        {a.title || "عنوان"} - {a.city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              value={address} onChangeText={setAddress}
              placeholder={t.checkout.address_placeholder}
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={3}
              style={[styles.addressInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
            />
          </View>

          {/* Payment */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.checkout.payment_method}</Text>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity key={m.key}
                style={[styles.payOption, { borderColor: payMethod === m.key ? colors.primary : colors.border, backgroundColor: payMethod === m.key ? colors.accent : "transparent" }]}
                onPress={() => setPayMethod(m.key)}>
                <View style={[styles.radio, { borderColor: payMethod === m.key ? colors.primary : colors.border }]}>
                  {payMethod === m.key && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
                {m.key === "google_pay" ? (
                  <FontAwesome5 name="google-pay" size={18} color={payMethod === m.key ? colors.primary : colors.mutedForeground} />
                ) : m.key === "apple_pay" ? (
                  <FontAwesome5 name="apple" size={18} color={payMethod === m.key ? colors.primary : colors.mutedForeground} />
                ) : m.key === "split" ? (
                  <FontAwesome5 name="hand-holding-usd" size={18} color={payMethod === m.key ? colors.primary : colors.mutedForeground} />
                ) : (
                  <Feather name={m.icon as any} size={18} color={payMethod === m.key ? colors.primary : colors.mutedForeground} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: payMethod === m.key ? colors.primary : colors.foreground, fontWeight: "600", fontSize: 14 }}>{m.label}</Text>
                  {m.desc && (
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{m.desc}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ height: bottomPad + 90 }} />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity style={[styles.orderBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={placeOrder} disabled={loading}>
          <Text style={styles.orderBtnText}>{loading ? t.checkout.placing_order : t.checkout.place_order}</Text>
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
  payOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  orderBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  orderBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  homeBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14 },
});
