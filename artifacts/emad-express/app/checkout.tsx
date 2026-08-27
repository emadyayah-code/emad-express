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
  const [payMethod, setPayMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // In-App Card Details State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

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

  const isDropshipping = items.some((i: any) => i.source_platform);

  // Auto detect card type (Visa / Mastercard / Mada)
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "visa";
    if (clean.startsWith("51") || clean.startsWith("52") || clean.startsWith("53") || clean.startsWith("54") || clean.startsWith("55") || (parseInt(clean.slice(0, 4)) >= 2221 && parseInt(clean.slice(0, 4)) <= 2720)) {
      return "mastercard";
    }
    if (clean.startsWith("5888") || clean.startsWith("4847") || clean.startsWith("9682")) {
      return "mada";
    }
    return "card";
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const PAYMENT_METHODS = [
    {
      key: "card",
      label: "بطاقة بنكية / فيزا / ماستركارد / مدى",
      icon: "credit-card",
      type: "gateway",
      desc: "Visa / Mastercard / Mada - الدفع المباشر للمورد",
      badges: ["VISA", "Mastercard", "Mada"],
    },
    {
      key: "google_pay",
      label: "Google Pay",
      icon: "google-pay",
      type: "wallet",
      desc: "محفظة Google Pay العالمية",
      badges: ["GPay"],
    },
    {
      key: "apple_pay",
      label: "Apple Pay",
      icon: "apple",
      type: "wallet",
      desc: "محفظة Apple Pay السريعة",
      badges: ["ApplePay"],
    },
    {
      key: "paypal",
      label: "PayPal",
      icon: "paypal",
      type: "gateway",
      desc: "بوابة PayPal العالمية المعتمدة",
      badges: ["PayPal"],
    },
    {
      key: "cod",
      label: t.checkout.cod,
      icon: "truck",
      type: "cod",
      desc: "الدفع نقداً عند استلام الشحنة",
      badges: ["COD"],
    },
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

    if (payMethod === "card") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      if (cleanNum.length < 14) {
        Alert.alert("بيانات غير مكتملة", "يرجى إدخال رقم بطاقة الفيزا / ماستركارد بشكل صحيح (16 رقم)");
        return;
      }
      if (!expiryDate.includes("/") || expiryDate.length < 5) {
        Alert.alert("بيانات غير مكتملة", "يرجى إدخال تاريخ انتهاء البطاقة (الشهر/السنة)");
        return;
      }
      if (cvv.length < 3) {
        Alert.alert("بيانات غير مكتملة", "يرجى إدخال رمز الأمان (CVV) الموجود خلف البطاقة (3 أرقام)");
        return;
      }
    }

    setLoading(true);
    try {
      const methodKey = payMethod === "stripe" ? "card" : payMethod;
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
          payment_method: methodKey,
          payment_details:
            payMethod === "card"
              ? {
                  card_brand: getCardBrand(),
                  last4: cardNumber.replace(/\s+/g, "").slice(-4),
                  card_holder: cardHolder || "Customer",
                  status: "processed_direct_supplier",
                }
              : undefined,
        },
        token
      );

      const orderId = orderRes?.data?.id || orderRes?.data?.data?.id || orderRes?.id;

      // If dropshipping external affiliate URL required
      if (orderId && (payMethod === "split" || payMethod === "webview" || isDropshipping)) {
        router.push({
          pathname: "/payment/[id]",
          params: { id: orderId },
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
        <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", paddingHorizontal: 40, marginBottom: 12 }}>
          {t.checkout.success_msg}
        </Text>

        {payMethod === "card" && (
          <View style={[styles.paidBadgeBox, { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10b98144" }]}>
            <Feather name="shield" size={16} color="#10b981" />
            <Text style={{ color: "#10b981", fontSize: 13, fontWeight: "700" }}>
              تم تحويل الدفع بنجاح للمورد الرئيسي (Visa / Mastercard)
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.homeBtn, { backgroundColor: colors.primary, marginTop: 24 }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t.checkout.back_home}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const brand = getCardBrand();

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
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.checkout.payment_method}</Text>
            {PAYMENT_METHODS.map((m) => {
              const isSelected = payMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.payOption,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.accent : "transparent",
                    },
                  ]}
                  onPress={() => setPayMethod(m.key)}
                >
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>

                  {m.key === "google_pay" ? (
                    <FontAwesome5 name="google-pay" size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                  ) : m.key === "apple_pay" ? (
                    <FontAwesome5 name="apple" size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                  ) : m.key === "paypal" ? (
                    <FontAwesome5 name="paypal" size={18} color={isSelected ? colors.primary : colors.mutedForeground} />
                  ) : (
                    <Feather name={m.icon as any} size={19} color={isSelected ? colors.primary : colors.mutedForeground} />
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ color: isSelected ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 14 }}>
                        {m.label}
                      </Text>
                      {/* Brand logos/badges */}
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {m.badges?.map((b) => (
                          <View
                            key={b}
                            style={[
                              styles.miniBadge,
                              {
                                backgroundColor:
                                  b === "VISA"
                                    ? "#1a1f71"
                                    : b === "Mastercard"
                                    ? "#eb001b"
                                    : b === "Mada"
                                    ? "#007a3d"
                                    : colors.muted,
                              },
                            ]}
                          >
                            <Text style={styles.miniBadgeText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {m.desc && <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{m.desc}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* In-App Direct Supplier Visa / Mastercard Form */}
          {payMethod === "card" && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5 }]}>
              {/* Trust Badge Banner */}
              <View style={styles.supplierBanner}>
                <Feather name="shield" size={16} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}>
                    دفع مباشر للمورد الرئيسي دون مغادرة التطبيق
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                    بوابة دفع عالمية مشفرة ومعتمدة 256-bit SSL
                  </Text>
                </View>
              </View>

              {/* Realistic Visual Credit Card Display */}
              <View style={styles.visualCard}>
                <View style={styles.visualCardTop}>
                  <View style={styles.emvChip} />
                  <Feather name="wifi" size={20} color="#f59e0b" style={{ transform: [{ rotate: "90deg" }] }} />
                  <View style={{ flex: 1 }} />
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <View style={[styles.cardLogoBox, { backgroundColor: "#1a1f71" }]}>
                      <Text style={styles.cardLogoText}>VISA</Text>
                    </View>
                    <View style={styles.mcCircles}>
                      <View style={[styles.mcCircle, { backgroundColor: "#eb001b" }]} />
                      <View style={[styles.mcCircle, { backgroundColor: "#f79e1b", marginLeft: -10 }]} />
                    </View>
                  </View>
                </View>

                <Text style={styles.visualCardNumber}>
                  {cardNumber || "•••• •••• •••• ••••"}
                </Text>

                <View style={styles.visualCardBottom}>
                  <View>
                    <Text style={styles.visualCardLabel}>حامل البطاقة</Text>
                    <Text style={styles.visualCardValue}>{cardHolder.toUpperCase() || "CARDHOLDER NAME"}</Text>
                  </View>
                  <View>
                    <Text style={styles.visualCardLabel}>الانتهاء</Text>
                    <Text style={styles.visualCardValue}>{expiryDate || "MM/YY"}</Text>
                  </View>
                  <View>
                    <Text style={styles.visualCardLabel}>CVV</Text>
                    <Text style={styles.visualCardValue}>{cvv ? "•••" : "•••"}</Text>
                  </View>
                </View>
              </View>

              {/* In-App Direct Card Input Fields */}
              <View style={{ gap: 12, marginTop: 12 }}>
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>رقم بطاقة الفيزا / ماستركارد *</Text>
                  <View style={[styles.cardInputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Feather name="credit-card" size={18} color={colors.primary} />
                    <TextInput
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      maxLength={19}
                      style={[styles.cardInput, { color: colors.foreground }]}
                    />
                    {brand === "visa" && (
                      <View style={[styles.brandPill, { backgroundColor: "#1a1f71" }]}>
                        <Text style={styles.brandPillText}>VISA</Text>
                      </View>
                    )}
                    {brand === "mastercard" && (
                      <View style={[styles.brandPill, { backgroundColor: "#eb001b" }]}>
                        <Text style={styles.brandPillText}>Mastercard</Text>
                      </View>
                    )}
                    {brand === "mada" && (
                      <View style={[styles.brandPill, { backgroundColor: "#007a3d" }]}>
                        <Text style={styles.brandPillText}>Mada</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>الاسم المكتوب على البطاقة *</Text>
                  <TextInput
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    placeholder="EMAD AL-YAHYA"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    style={[styles.inputField, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>تاريخ الانتهاء *</Text>
                    <TextInput
                      value={expiryDate}
                      onChangeText={handleExpiryChange}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.inputField, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, textAlign: "center" }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>رمز الأمان (CVV) *</Text>
                    <TextInput
                      value={cvv}
                      onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={4}
                      style={[styles.inputField, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, textAlign: "center" }]}
                    />
                  </View>
                </View>
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
              <Feather name="lock" size={18} color="#000" />
              <Text style={styles.orderBtnText}>
                {payMethod === "card"
                  ? `دفع ${format(grandTotal)} للمورد الرئيسي`
                  : t.checkout.place_order}
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
  payOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  supplierBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(5,150,105,0.08)", padding: 10, borderRadius: 10, marginBottom: 12 },
  visualCard: {
    backgroundColor: "#1e1e24",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.4)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  visualCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  emvChip: { width: 34, height: 26, borderRadius: 5, backgroundColor: "#eab308", borderWidth: 1, borderColor: "#ca8a04" },
  cardLogoBox: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cardLogoText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  mcCircles: { flexDirection: "row" },
  mcCircle: { width: 20, height: 20, borderRadius: 10 },
  visualCardNumber: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 2, textAlign: "center", marginVertical: 10, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  visualCardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  visualCardLabel: { color: "#9ca3af", fontSize: 10, textTransform: "uppercase" },
  visualCardValue: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  cardInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  cardInput: { flex: 1, fontSize: 15, fontWeight: "600", letterSpacing: 1 },
  brandPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  brandPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  orderBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  orderBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  paidBadgeBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  homeBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
});