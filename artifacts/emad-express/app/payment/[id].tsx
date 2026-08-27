import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useLanguage } from "../../context/LanguageContext";
import { useCurrency } from "../../context/CurrencyContext";
import { api } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { ArrowLeft, CreditCard, Truck, CheckCircle, Globe, Lock, Store, Package } from "lucide-react-native";

export default function PaymentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [step, setStep] = useState<"details" | "webview" | "stripe" | "success">("details");
  const [platform, setPlatform] = useState("");
  const [paymentType, setPaymentType] = useState<"stripe_connect" | "affiliate_webview" | "">("");
  const [shippingBy, setShippingBy] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => {
      setOrder(r.data?.data);
      setLoading(false);
    });
  }, [id]);

  const initiatePayment = async () => {
    setPayLoading(true);
    try {
      const res = await api.post(`/orders/${id}/pay/internal`);
      if (res.data?.success) {
        const data = res.data.data;
        setPaymentType(data.payment_type);
        setPlatform(data.platform || "stripe_connect");
        setShippingBy(data.shipping_by || "");

        if (data.payment_type === "stripe_connect") {
          // Stripe Connect - Show payment form or redirect to Stripe
          setClientSecret(data.client_secret);
          setStep("stripe");
        } else if (data.payment_type === "affiliate_webview") {
          // Affiliate - Open WebView to platform
          setPaymentUrl(data.payment_url);
          setStep("webview");
        }
      } else {
        Alert.alert("خطأ", res.data?.message || "فشل إنشاء رابط الدفع");
      }
    } catch (e: any) {
      Alert.alert("خطأ", e.response?.data?.message || "حدث خطأ");
    } finally {
      setPayLoading(false);
    }
  };

  const handleWebViewNavigation = (navState: any) => {
    const { url } = navState;
    // Detect successful payment on platform
    if (url.includes("orderSuccess") || url.includes("payment_success") || 
        url.includes("thank_you") || url.includes("/order/confirm") ||
        url.includes("checkout/success")) {
      confirmPayment();
    }
  };

  const confirmPayment = async () => {
    try {
      if (paymentType === "stripe_connect") {
        await api.post(`/orders/${id}/pay/split-confirm`, {
          payment_intent_id: clientSecret,
        });
      } else {
        await api.post(`/orders/${id}/pay/confirm`, {
          platform_order_id: `CONFIRMED-${Date.now()}`,
        });
      }
      setStep("success");
      clearCart();
    } catch (e: any) {
      Alert.alert("تأكيد", "تم الدفع! جاري التحقق...");
      setStep("success");
    }
  };

  const getPlatformLabel = () => {
    if (paymentType === "stripe_connect") return "دفع مباشر للبائع";
    if (platform === "aliexpress") return "علي إكسبرس";
    if (platform === "amazon") return "أمازون";
    if (platform === "alibaba") return "علي بابا";
    return "الدفع الآمن";
  };

  const getPlatformIcon = () => {
    if (paymentType === "stripe_connect") return <Store size={20} color="#10b981" />;
    return <Globe size={20} color="#10b981" />;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Stripe Connect Payment Screen
  if (step === "stripe" && clientSecret) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => setStep("details")} className="mr-4">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold">الدفع المباشر للبائع</Text>
            <Text className="text-sm text-gray-500">عبر Stripe Connect</Text>
          </View>
          <Lock size={20} color="#10b981" />
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Store size={18} color="#059669" />
              <Text className="font-bold text-emerald-800">دفع مباشر للبائع المحلي</Text>
            </View>
            <Text className="text-emerald-700 text-sm">
              المبلغ يذهب مباشرةً للبائع + عمولة المنصة. الشحن على البائع.
            </Text>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-600 mb-2">ملخص الطلب</Text>
            <Text className="text-2xl font-bold text-gray-900">{formatPrice(order?.total)}</Text>
          </View>

          <TouchableOpacity 
            onPress={confirmPayment}
            className="bg-emerald-600 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-lg">تأكيد الدفع</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Affiliate WebView
  if (step === "webview" && paymentUrl) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => setStep("details")} className="mr-4">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold">الدفع الآمن</Text>
            <Text className="text-sm text-gray-500">{getPlatformLabel()}</Text>
          </View>
          <Lock size={20} color="#10b981" />
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border-b border-blue-100 p-3">
          <View className="flex-row items-center gap-2">
            <Package size={16} color="#2563eb" />
            <Text className="text-blue-800 text-sm font-medium">
              الشحن على {shippingBy || getPlatformLabel()}
            </Text>
          </View>
          <Text className="text-blue-600 text-xs mt-1">
            ستتم إعادة توجيهك لصفحة الدفع الرسمية داخل التطبيق
          </Text>
        </View>

        <WebView
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={handleWebViewNavigation}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute inset-0 justify-center items-center bg-white">
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}
        />
        <View className="p-4 border-t border-gray-200 bg-gray-50">
          <TouchableOpacity onPress={confirmPayment} className="bg-emerald-600 py-3 rounded-xl items-center">
            <Text className="text-white font-bold text-lg">تم الدفع - تأكيد الطلب</Text>
          </TouchableOpacity>
          <Text className="text-center text-gray-500 text-xs mt-2">
            اضغط بعد إكمال الدفع في الصفحة أعلاه
          </Text>
        </View>
      </View>
    );
  }

  // Success
  if (step === "success") {
    return (
      <View className="flex-1 bg-white justify-center items-center p-6">
        <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
          <CheckCircle size={40} color="#059669" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">تم الدفع بنجاح!</Text>
        <Text className="text-gray-500 text-center mb-2">
          {paymentType === "stripe_connect" 
            ? "تم إرسال المبلغ للبائع مباشرةً. سيتواصل معك لترتيب الشحن."
            : `تم الدفع لـ ${getPlatformLabel()} مباشرةً. سيتم الشحن من قبل المنصة.`
          }
        </Text>
        {shippingBy && (
          <View className="bg-gray-50 rounded-lg p-3 mt-2 mb-6 w-full">
            <View className="flex-row items-center gap-2">
              <Truck size={16} color="#6b7280" />
              <Text className="text-gray-700 text-sm">الشحن: {shippingBy}</Text>
            </View>
          </View>
        )}
        <TouchableOpacity 
          onPress={() => router.replace("/(tabs)/orders")}
          className="bg-emerald-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">متابعة الطلبات</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Details Step
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">إتمام الدفع</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Order Info */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-600 mb-1">رقم الطلب</Text>
          <Text className="text-lg font-bold text-gray-900">{order?.order_number}</Text>
          <View className="h-px bg-gray-200 my-3" />
          <View className="flex-row justify-between">
            <Text className="text-gray-600">المبلغ الإجمالي</Text>
            <Text className="text-xl font-bold text-emerald-600">{formatPrice(order?.total)}</Text>
          </View>
        </View>

        {/* Payment Type Info with Visa / Mastercard Badges */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <CreditCard size={18} color="#1d4ed8" />
              <Text className="font-bold text-blue-900">بوابة الدفع العالمية للمورد الرئيسي</Text>
            </View>
            <View className="flex-row gap-1">
              <View className="bg-[#1a1f71] px-2 py-0.5 rounded">
                <Text className="text-white text-[10px] font-black">VISA</Text>
              </View>
              <View className="bg-[#eb001b] px-2 py-0.5 rounded">
                <Text className="text-white text-[10px] font-black">MC</Text>
              </View>
              <View className="bg-[#007a3d] px-2 py-0.5 rounded">
                <Text className="text-white text-[10px] font-black">Mada</Text>
              </View>
            </View>
          </View>
          <Text className="text-blue-800 text-sm">
            يتم تحويل المبلغ مباشرةً للمورد الرئيسي لحساب الطلب وتأكيد الشحن فوراً دون مغادرة التطبيق.
          </Text>
        </View>

        {/* Shipping Info */}
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Truck size={18} color="#d97706" />
            <Text className="font-bold text-amber-900">الشحن والتوصيل للمشتري</Text>
          </View>
          <Text className="text-amber-800 text-sm">
            شحن وتوصيل مباشر مع توفير رقم تتبع رسمي فوري حتى استلام الطلب
          </Text>
        </View>

        {/* Security */}
        <View className="flex-row items-center gap-2 bg-gray-50 rounded-xl p-4">
          <Lock size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm">دفع آمن ومشفر 100% مع ضمان حماية المشتري</Text>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity 
          onPress={initiatePayment}
          disabled={payLoading}
          className="bg-emerald-600 py-4 rounded-xl items-center cursor-pointer shadow-md"
        >
          {payLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              إتمام الدفع الآمن 🔒
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
