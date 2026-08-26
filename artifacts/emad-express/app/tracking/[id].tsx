import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";
import { useCurrency } from "../../context/CurrencyContext";
import { api } from "../../lib/api";
import { ArrowLeft, Truck, Package, MapPin, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react-native";

const STATUS_STEPS = [
  { key: "pending", label: "قيد الانتظار", label_en: "Pending" },
  { key: "processing", label: "جاري التجهيز", label_en: "Processing" },
  { key: "shipped", label: "تم الشحن", label_en: "Shipped" },
  { key: "in_transit", label: "في الطريق", label_en: "In Transit" },
  { key: "out_for_delivery", label: "خارج للتوصيل", label_en: "Out for Delivery" },
  { key: "delivered", label: "تم التسليم", label_en: "Delivered" },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<any>(null);
  const [fulfillment, setFulfillment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    try {
      const [orderRes, fulfillRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/orders/${id}/fulfillment`),
      ]);
      setOrder(orderRes.data?.data);
      setFulfillment(fulfillRes.data?.data);
    } catch (e) {
      console.error("Tracking load error", e);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    const status = fulfillment?.fulfillment_status || order?.fulfillment_status || "pending";
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const openTrackingUrl = () => {
    const trackingNum = fulfillment?.supplier_tracking || order?.supplier_tracking;
    const platform = fulfillment?.fulfillment_platform || order?.fulfillment_platform;

    let url = "";
    if (platform === "aliexpress" && trackingNum) {
      url = `https://global.cainiao.com/detail.htm?mailNoList=${trackingNum}`;
    } else if (platform === "amazon" && trackingNum) {
      url = `https://track.amazon.com/tracking/${trackingNum}`;
    } else if (platform === "alibaba" && trackingNum) {
      url = `https://www.17track.net/en#nums=${trackingNum}`;
    }

    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ArrowLeft size={20} color="#374151" />
          <Text className="mr-2 text-gray-600">{language === "ar" ? "رجوع" : "Back"}</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold mb-6">{language === "ar" ? "تتبع الشحنة" : "Track Shipment"}</Text>

        {/* Order Info */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-2">{order?.order_number}</Text>
          <Text className="text-gray-600">{language === "ar" ? "المجموع: " : "Total: "}{formatPrice(order?.total || 0)}</Text>
          <Text className="text-gray-600 mt-1">
            {language === "ar" ? "المورد: " : "Supplier: "}
            {order?.fulfillment_platform === "aliexpress" ? "AliExpress" :
             order?.fulfillment_platform === "amazon" ? "Amazon" :
             order?.fulfillment_platform === "alibaba" ? "Alibaba" : "Unknown"}
          </Text>
        </View>

        {/* Progress Steps */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-4">{language === "ar" ? "حالة الطلب" : "Order Status"}</Text>
          {STATUS_STEPS.map((step, idx) => (
            <View key={step.key} className="flex-row items-center mb-3">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                idx <= currentStep ? "bg-emerald-600" : "bg-gray-200"
              }`}>
                {idx <= currentStep ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <Clock size={16} color="#9ca3af" />
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className={`font-bold ${idx <= currentStep ? "text-emerald-600" : "text-gray-400"}`}>
                  {language === "ar" ? step.label : step.label_en}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tracking Number */}
        {(fulfillment?.supplier_tracking || order?.supplier_tracking) && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold mb-2">{language === "ar" ? "رقم التتبع" : "Tracking Number"}</Text>
            <Text className="text-emerald-600 font-mono text-lg">{fulfillment?.supplier_tracking || order?.supplier_tracking}</Text>
            <TouchableOpacity onPress={openTrackingUrl} className="flex-row items-center mt-3 bg-emerald-50 p-3 rounded-xl">
              <ExternalLink size={16} color="#10b981" />
              <Text className="mr-2 text-emerald-600 font-bold">
                {language === "ar" ? "تتبع على موقع الناقل" : "Track on carrier site"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shipments List */}
        {fulfillment?.shipments?.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold mb-3">{language === "ar" ? "الشحنات" : "Shipments"}</Text>
            {fulfillment.shipments.map((s: any) => (
              <View key={s.id} className="border-b border-gray-100 py-2 last:border-0">
                <View className="flex-row items-center">
                  <Truck size={16} color="#6b7280" />
                  <Text className="mr-2 font-bold">{s.tracking_number}</Text>
                </View>
                <Text className="text-gray-500 text-sm mt-1">{language === "ar" ? "الحالة: " : "Status: "}{s.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Platform Order ID */}
        {(fulfillment?.platform_order_id || order?.platform_order_id) && (
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold mb-2">{language === "ar" ? "رقم الطلب في المورد" : "Supplier Order ID"}</Text>
            <Text className="text-gray-600 font-mono">{fulfillment?.platform_order_id || order?.platform_order_id}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
