import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../lib/api";
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Lock, Shield } from "lucide-react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState(params.email?.toString() || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("تنبيه", "يرجى إدخال كود التحقق المكون من 6 أرقام");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, code });
      if (res.data?.success) {
        // Save token
        const token = res.data.token;
        // Navigate to main app
        router.replace("/(tabs)");
      } else {
        Alert.alert("خطأ", res.data?.message || "كود التحقق غير صحيح");
      }
    } catch (e: any) {
      Alert.alert("خطأ", e.response?.data?.message || "حدث خطأ أثناء التحقق");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await api.post("/auth/resend-verification", { email });
      if (res.data?.success) {
        Alert.alert("تم", "تم إرسال كود تحقق جديد إلى بريدك");
        setCountdown(60);
        setCanResend(false);
      } else {
        Alert.alert("خطأ", res.data?.message || "فشل إعادة الإرسال");
      }
    } catch (e: any) {
      Alert.alert("خطأ", e.response?.data?.message || "حدث خطأ");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-12">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-4">
            <Shield size={36} color="#059669" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">التحقق من البريد الإلكتروني</Text>
          <Text className="text-gray-500 text-center mt-2 px-4">
            أرسلنا كود تحقق مكون من 6 أرقام إلى{" "}
            <Text className="font-semibold text-emerald-600">{email}</Text>
          </Text>
        </View>

        {/* Code Input */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">كود التحقق</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50">
            <Lock size={18} color="#9ca3af" />
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="أدخل الكود (6 أرقام)"
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 py-4 px-3 text-lg text-center tracking-[8px]"
              style={{ fontVariant: ['tabular-nums'] }}
            />
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
          className={`py-4 rounded-xl items-center ${code.length === 6 ? "bg-emerald-600" : "bg-gray-300"}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <CheckCircle size={20} color="white" />
              <Text className="text-white font-bold text-lg">تفعيل الحساب</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View className="items-center mt-6">
          {canResend ? (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendLoading}
              className="flex-row items-center gap-2"
            >
              <RefreshCw size={16} color="#059669" />
              <Text className="text-emerald-600 font-medium">
                {resendLoading ? "جاري الإرسال..." : "إعادة إرسال الكود"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-gray-400">
              يمكنك إعادة الإرسال بعد{" "}
              <Text className="text-emerald-600 font-bold">{countdown}</Text>{" "}
              ثانية
            </Text>
          )}
        </View>

        {/* Change Email */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="items-center mt-8"
        >
          <Text className="text-gray-400 text-sm">
            البريد الإلكتروني غير صحيح؟{" "}
            <Text className="text-emerald-600 font-medium">تسجيل حساب جديد</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
