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
  Linking,
  Modal,
  FlatList,
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
import { ALL_COUNTRIES, Country } from "@/lib/countries";

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
  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");

  const filteredCountries = searchCountry
    ? ALL_COUNTRIES.filter(
        (c) =>
          c.nameAr.includes(searchCountry) ||
          c.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
          c.dialCode.includes(searchCountry)
      )
    : ALL_COUNTRIES;

  const [payMethod, setPayMethod] = useState("paypal");
  const [paySubMode, setPaySubMode] = useState<"card" | "paypal_account">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const groups = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    return groups.join(" ");
  };

  const formatCardExp = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "MasterCard";
    if (/^3[47]/.test(clean)) return "AMEX";
    if (/^(588845|4|6|9)/.test(clean)) return "مدى Mada";
    return "بطاقة بنكية";
  };

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
      key: "paypal",
      label: "PayPal والبطاقات المعتمدة (Visa / MasterCard)",
      icon: "shield",
      desc: "دفع عالمي فوري وآمن بضمان وحماية المشتري الكاملة عبر PayPal بالبطاقات البنكية المعتمدة",
      badges: [
        { label: "PayPal Live 💳", bg: "#003087" },
        { label: "حماية المشتري 🛡️", bg: "#0079C1" },
        { label: "دفع فوري ⚡", bg: "#059669" },
      ],
    },
    {
      key: "electronic_payment",
      label: "الدفع والشراء المباشر عبر عماد اكسبرس (emadexpress Direct)",
      icon: "shield",
      desc: "فتح صفحة الشراء والدفع مباشرة عبر منصة عماد اكسبرس لتسديد القيمة وتأكيد طلبك بأمان",
      badges: [
        { label: "emadexpress Direct 🛍️", bg: "#e11d48" },
        { label: "دفع وتأكيد فوري", bg: "#991b1b" },
      ],
    },
  ];

  const isYemen = React.useMemo(() => {
    const text = (address || "").toLowerCase();
    const yemenKeywords = [
      "اليمن", "yemen", "ye", "تعز", "taiz", "صنعاء", "sana", "عدن", "aden",
      "حضرموت", "hadramout", "الحديدة", "hodeida", "إب", "ibb", "ذمار", "dhamar",
      "مأرب", "marib", "شبوة", "shabwa", "المهرة", "mahrah", "لحج", "lahj",
      "أبين", "abyan", "صعدة", "saada", "حجة", "hajjah", "عمران", "amran",
      "الضالع", "dhale", "ريمة", "raymah", "سقطرى", "socotra", "المكلا", "mukalla", "سيئون", "seiyun"
    ];
    return yemenKeywords.some(k => text.includes(k));
  }, [address]);

  const [shippingMethod, setShippingMethod] = useState<string>("dhl");

  useEffect(() => {
    if (isYemen) {
      setShippingMethod("dhl");
    } else {
      if (shippingMethod !== "standard" && shippingMethod !== "premium") {
        setShippingMethod("standard");
      }
    }
  }, [isYemen]);

  // emadexpress Shipping Options Definition: 529 SAR ONLY for Yemen
  const yemenOptions = [
    {
      id: "dhl",
      carrier: "DHL Express",
      title: "دي إتش إل إكسبريس لليمن (DHL Express)",
      badge: "شحن سريع دولي لليمن ✈️",
      badgeBg: "#d97706",
      desc: "شحن جوي سريع ومباشر لكافة محافظات اليمن عبر عماد اكسبرس • تسليم 7-15 يوم عمل (خاص باليمن فقط)",
      fee: 529,
      isFree: false,
    },
  ];

  const globalOptions = [
    {
      id: "standard",
      carrier: "emadexpress Standard Shipping",
      title: total >= 100 ? "شحن مجاني عماد اكسبرس (emadexpress Choice)" : "شحن قياسي عماد اكسبرس (emadexpress Standard)",
      badge: total >= 100 ? "Choice مجاني 🎉" : "توصيل قياسي",
      badgeBg: total >= 100 ? "#059669" : "#2563eb",
      desc: total >= 100
        ? "شحن مجاني رسمي عبر Choice لطلبك بقيمة 100+ ر.س • تسليم 10-18 يوم"
        : "شحن قياسي دولي موثوق مع تتبع • تسليم 10-18 يوم (مجاني عند الشراء بـ 100 ر.س)",
      fee: total >= 100 ? 0 : 15,
      isFree: total >= 100,
    },
    {
      id: "premium",
      carrier: "emadexpress Premium Shipping",
      title: "شحن سريع بريميوم (emadexpress Premium)",
      badge: "أولوية فائقة ⚡",
      badgeBg: "#7c3aed",
      desc: "شحن جوي سريع بأعلى أولوية وتسليم للباب • تسليم 5-9 أيام عمل",
      fee: 45,
      isFree: false,
    },
  ];

  const shippingOptions = isYemen ? yemenOptions : globalOptions;
  const currentShippingOption = shippingOptions.find(o => o.id === shippingMethod) || shippingOptions[0];
  const shippingFee = currentShippingOption.fee;

  // Tax: 15% VAT for Saudi Arabia, 0% for Yemen and International (AliExpress export)
  const isSaudi = !isYemen && (address.includes("السعودية") || address.includes("Saudi") || address.includes("SA") || address.includes("الرياض") || address.includes("جدة") || address.includes("الدمام") || address.includes("مكة") || address.includes("المدينة"));
  const tax = isSaudi ? Math.round(total * 0.15) : 0;
  const grandTotal = total + tax + shippingFee;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function placeOrder() {
    if (!address.trim()) {
      Alert.alert("تنبيه", t.checkout?.address_required || "يرجى تحديد عنوان التوصيل أولاً");
      return;
    }

    if (payMethod === "paypal" && paySubMode === "card") {
      const cleanNum = cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 15) {
        Alert.alert("بيانات البطاقة ناقصة", "يرجى إدخال رقم البطاقة البنكية المكون من 16 رقماً");
        return;
      }
      if (!cardExp.includes("/") || cardExp.length < 4) {
        Alert.alert("تاريخ الانتهاء", "يرجى إدخال تاريخ انتهاء البطاقة (شهر/سنة مثل 08/28)");
        return;
      }
      if (cardCvv.length < 3) {
        Alert.alert("رمز الأمان CVV", "يرجى إدخال رمز أمان البطاقة CVV (3 أو 4 أرقام)");
        return;
      }
    }

    if (items.length === 0) {
      Alert.alert("تنبيه", "سلة المشتريات فارغة");
      return;
    }

    setLoading(true);
    try {
      const recipientName = defaultAddress?.recipientName || "عميل عماد إكسبرس";
      const recipientPhone = defaultAddress?.phone || "";

      const orderRes = await api.post(
        "/orders",
        {
          items: items.map((i) => ({
            product_id: i.id,
            product_name: String(i.name || "Product").trim().slice(0, 500),
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
            source_url: (i as any).source_url || (i as any).sourceUrl || "",
          })),
          shipping_address: address,
          shipping_method: shippingMethod,
          shipping_country: selectedCountry.code || (isYemen ? "YE" : (isSaudi ? "SA" : "GLOBAL")),
          payment_method: payMethod === "electronic_payment" ? "aliexpress_direct" : payMethod,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
        },
        token
      );

      const orderId =
        (orderRes as any)?.data?.id ||
        (orderRes as any)?.id ||
        (orderRes as any)?.data?.data?.id;

      if (payMethod === "electronic_payment") {
        const itemWithUrl = items.find((i: any) => i.source_url || i.sourceUrl);
        const aliUrl = (itemWithUrl as any)?.source_url || (itemWithUrl as any)?.sourceUrl || 
          (items[0]?.name ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(items[0].name)}` : "https://www.aliexpress.com");
        try {
          await Linking.openURL(aliUrl);
        } catch {}
      }

      clearCart();

      if (orderId) {
        router.replace(`/payment/${orderId}`);
      } else {
        setSuccess(true);
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
              <Text style={{ color: colors.foreground, fontSize: 13 }}>{tax === 0 ? "0 ر.س (معفى)" : format(tax)}</Text>
            </View>
            <View style={styles.orderItem}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t.checkout.shipping}</Text>
                <View style={[styles.miniBadge, { backgroundColor: currentShippingOption.badgeBg }]}>
                  <Text style={styles.miniBadgeText}>{currentShippingOption.carrier}</Text>
                </View>
              </View>
              <Text style={{ color: shippingFee === 0 ? "#059669" : colors.foreground, fontSize: 13, fontWeight: "700" }}>
                {shippingFee === 0 ? t.checkout.free_shipping : format(shippingFee)}
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

            {/* Country Selector Chip with Flag */}
            <TouchableOpacity
              onPress={() => {
                setSearchCountry("");
                setCountryModalVisible(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>
                  {language === "en" ? selectedCountry.nameEn : selectedCountry.nameAr} ({selectedCountry.code})
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>تغيير دولة الشحن 🌍</Text>
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>

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

          {/* Shipping Methods Selection (emadexpress Shipping) */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="truck" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 0 }]}>طريقة الشحن (emadexpress Shipping)</Text>
              </View>
              <View style={[styles.miniBadge, { backgroundColor: "#f59e0b" }]}>
                <Text style={styles.miniBadgeText}>شحن عماد اكسبرس ⚡</Text>
              </View>
            </View>

            {isYemen ? (
              <View style={[styles.infoBanner, { backgroundColor: "rgba(217, 119, 6, 0.08)", borderColor: "rgba(217, 119, 6, 0.3)", marginBottom: 12 }]}>
                <Feather name="map-pin" size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#d97706", fontWeight: "700", fontSize: 12, marginBottom: 2 }}>
                    📍 التوصيل إلى اليمن (emadexpress Yemen Direct)
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>
                    يتم الشحن المباشر لليمن عبر دي إتش إل إكسبريس (DHL Express) بمبلغ 529 ر.س لضمان سرعة وتأمين الشحنة.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.infoBanner, { backgroundColor: total >= 100 ? "rgba(5, 150, 105, 0.08)" : "rgba(37, 99, 235, 0.08)", borderColor: total >= 100 ? "rgba(5, 150, 105, 0.3)" : "rgba(37, 99, 235, 0.3)", marginBottom: 12 }]}>
                <Feather name="gift" size={16} color={total >= 100 ? "#059669" : "#2563eb"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: total >= 100 ? "#059669" : "#2563eb", fontWeight: "700", fontSize: 12, marginBottom: 2 }}>
                    {total >= 100 ? "🎉 مؤهل للشحن المجاني (emadexpress Choice)" : `💡 أضف منتجات بقيمة ${format(100 - total)} إضافية للحصول على شحن مجاني!`}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>
                    خدمة شحن عماد اكسبرس القياسية مجانية لجميع الطلبات من 100 ر.س فأكثر.
                  </Text>
                </View>
              </View>
            )}

            {shippingOptions.map((opt) => {
              const isSelected = shippingMethod === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.payOption,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? "rgba(245, 158, 11, 0.08)" : "transparent",
                    },
                  ]}
                  onPress={() => setShippingMethod(opt.id)}
                >
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 14 }}>
                        {opt.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={[styles.miniBadge, { backgroundColor: opt.badgeBg }]}>
                          <Text style={styles.miniBadgeText}>{opt.badge}</Text>
                        </View>
                        <Text style={{ color: opt.fee === 0 ? "#059669" : colors.primary, fontWeight: "800", fontSize: 14 }}>
                          {opt.fee === 0 ? "مجاني" : format(opt.fee)}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
                      {opt.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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

                    {/* Direct Card Entry or PayPal Account Toggle */}
                    {isSelected && m.key === "paypal" && (
                      <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                        {/* Submode Switcher */}
                        <View style={{ flexDirection: "row", backgroundColor: colors.muted, padding: 4, borderRadius: 10, marginBottom: 12 }}>
                          <TouchableOpacity
                            onPress={() => setPaySubMode("card")}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              alignItems: "center",
                              borderRadius: 8,
                              backgroundColor: paySubMode === "card" ? colors.card : "transparent",
                              shadowColor: "#000",
                              shadowOpacity: paySubMode === "card" ? 0.08 : 0,
                              shadowRadius: 4,
                              elevation: paySubMode === "card" ? 2 : 0,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: paySubMode === "card" ? colors.foreground : colors.mutedForeground }}>
                              💳 البطاقة البنكية المباشرة
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setPaySubMode("paypal_account")}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              alignItems: "center",
                              borderRadius: 8,
                              backgroundColor: paySubMode === "paypal_account" ? "#003087" : "transparent",
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: paySubMode === "paypal_account" ? "#fff" : colors.mutedForeground }}>
                              حساب بايبال السريع
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {paySubMode === "card" ? (
                          <View style={{ gap: 10 }}>
                            {/* Visual Card Preview */}
                            <View style={{
                              backgroundColor: "#0f172a",
                              borderRadius: 14,
                              padding: 16,
                              borderWidth: 1,
                              borderColor: "#f59e0b40",
                            }}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Feather name="shield" size={14} color="#f59e0b" />
                                  <Text style={{ color: "#f59e0b", fontSize: 11, fontWeight: "800" }}>بطاقة معتمدة عالمياً</Text>
                                </View>
                                <View style={{ backgroundColor: "#f59e0b20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#f59e0b40" }}>
                                  <Text style={{ color: "#fbbf24", fontSize: 10, fontWeight: "800" }}>{getCardBrand(cardNumber)}</Text>
                                </View>
                              </View>

                              <Text style={{ color: "#fef08a", fontSize: 16, fontWeight: "700", letterSpacing: 2, textAlign: "left", marginBottom: 12, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }}>
                                {cardNumber || "•••• •••• •••• ••••"}
                              </Text>

                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <View>
                                  <Text style={{ color: "#94a3b8", fontSize: 9 }}>حامل البطاقة</Text>
                                  <Text style={{ color: "#f8fafc", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                                    {cardHolder || defaultAddress?.recipientName || "CARDHOLDER NAME"}
                                  </Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                  <Text style={{ color: "#94a3b8", fontSize: 9 }}>تاريخ الانتهاء</Text>
                                  <Text style={{ color: "#f8fafc", fontSize: 11, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }}>
                                    {cardExp || "MM/YY"}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Card Number Input */}
                            <View>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>رقم البطاقة (16 رقماً)</Text>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>{getCardBrand(cardNumber)}</Text>
                              </View>
                              <TextInput
                                value={cardNumber}
                                onChangeText={(val) => setCardNumber(formatCardNumber(val))}
                                placeholder="0000 0000 0000 0000"
                                placeholderTextColor={colors.mutedForeground}
                                keyboardType="numeric"
                                maxLength={19}
                                style={{
                                  backgroundColor: colors.muted,
                                  color: colors.foreground,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  fontSize: 14,
                                  textAlign: "left",
                                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                                }}
                              />
                            </View>

                            {/* Cardholder Name Input */}
                            <View>
                              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>اسم حامل البطاقة</Text>
                              <TextInput
                                value={cardHolder}
                                onChangeText={setCardHolder}
                                placeholder="الاسم كما هو مطبوع على البطاقة"
                                placeholderTextColor={colors.mutedForeground}
                                autoCapitalize="characters"
                                style={{
                                  backgroundColor: colors.muted,
                                  color: colors.foreground,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  fontSize: 13,
                                  textAlign: isRTL ? "right" : "left",
                                }}
                              />
                            </View>

                            {/* Exp and CVV Grid */}
                            <View style={{ flexDirection: "row", gap: 10 }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>الانتهاء (شهر / سنة)</Text>
                                <TextInput
                                  value={cardExp}
                                  onChangeText={(val) => setCardExp(formatCardExp(val))}
                                  placeholder="MM/YY"
                                  placeholderTextColor={colors.mutedForeground}
                                  keyboardType="numeric"
                                  maxLength={5}
                                  style={{
                                    backgroundColor: colors.muted,
                                    color: colors.foreground,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    fontSize: 13,
                                    textAlign: "center",
                                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                                  }}
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>رمز الأمان (CVV)</Text>
                                <TextInput
                                  value={cardCvv}
                                  onChangeText={(val) => setCardCvv(val.replace(/\D/g, "").slice(0, 4))}
                                  placeholder="•••"
                                  placeholderTextColor={colors.mutedForeground}
                                  keyboardType="numeric"
                                  secureTextEntry
                                  maxLength={4}
                                  style={{
                                    backgroundColor: colors.muted,
                                    color: colors.foreground,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    fontSize: 13,
                                    textAlign: "center",
                                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                                  }}
                                />
                              </View>
                            </View>

                            {/* Security Notice */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(5, 150, 105, 0.08)", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(5, 150, 105, 0.2)" }}>
                              <Feather name="check-circle" size={13} color="#059669" />
                              <Text style={{ fontSize: 10, color: "#059669", fontWeight: "700", flex: 1 }}>
                                تشفير بنكي 256-bit وحماية المشتري المعتمدة من PayPal عالمياً
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: colors.muted, padding: 12, borderRadius: 10, alignItems: "center" }}>
                            <Text style={{ fontSize: 12, color: colors.foreground, textAlign: "center", lineHeight: 18 }}>
                              سيتم فتح نافذة PayPal الرسمية فور تأكيد الطلب لتسجيل الدخول والسداد السريع بحسابك.
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Secure Payment Information Box */}
          <View style={[styles.infoBanner, { backgroundColor: "rgba(245, 158, 11, 0.06)", borderColor: "rgba(245, 158, 11, 0.25)" }]}>
            <Feather name="shield" size={18} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13, marginBottom: 2 }}>
                بوابة دفع إلكتروني آمنة ومشفرة 100%
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17 }}>
                عند الضغط على المتابعة، ستفتح نافذة الدفع الإلكتروني المشفرة لإتمام طلبك مباشرة مع ضمان كامل لحماية المشتري.
              </Text>
            </View>
          </View>
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
                {`المتابعة لإتمام الدفع الآمن (${format(grandTotal)}) 🔒`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {/* All Countries Selection Modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "800" }}>اختر دولة الشحن 🌍</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={searchCountry}
                onChangeText={setSearchCountry}
                placeholder="ابحث بالاسم أو الرمز..."
                placeholderTextColor={colors.mutedForeground}
                style={{ flex: 1, color: colors.foreground, paddingVertical: 10, fontSize: 13, textAlign: isRTL ? "right" : "left" }}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryModalVisible(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
                      {language === "en" ? item.nameEn : item.nameAr}
                    </Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "600" }}>
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
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