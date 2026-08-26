import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const { format } = useCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", token],
    queryFn: () => api.get("/orders", token),
    enabled: !!token,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:    { label: t.orders.status.pending,    color: "#d97706", bg: "#fef3c7" },
    processing: { label: t.orders.status.processing, color: "#2563eb", bg: "#dbeafe" },
    shipped:    { label: t.orders.status.shipped,    color: "#7c3aed", bg: "#ede9fe" },
    delivered:  { label: t.orders.status.delivered,  color: "#059669", bg: "#d1fae5" },
    cancelled:  { label: t.orders.status.cancelled,  color: "#dc2626", bg: "#fee2e2" },
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t.orders.title}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Feather name="lock" size={52} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>{t.orders.login_required}</Text>
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
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.orders.title}</Text>
      </View>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.mutedForeground }}>{t.common.loading}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Feather name="package" size={52} color={colors.mutedForeground} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>{t.orders.empty}</Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/products")}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{t.home.shop_now}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const s = statusConfig[item.status] || { label: item.status, color: "#6b7280", bg: "#f3f4f6" };
            return (
              <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={[styles.orderNum, { color: colors.foreground }]}>{item.order_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={{ color: s.color, fontSize: 12, fontWeight: "600" }}>{s.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                    {new Date(item.order_date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>{format(item.total)}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 + 84 : insets.bottom + 80 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 22, fontWeight: "700" },
  loginBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 4 },
  orderCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  orderNum: { fontSize: 14, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderTotal: { fontSize: 15, fontWeight: "700" },
});
