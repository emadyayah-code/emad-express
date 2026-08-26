import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { t } = useLanguage();
  const { format } = useCurrency();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t.cart.title}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Feather name="shopping-cart" size={60} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 18, fontWeight: "600" }}>{t.cart.empty}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{t.cart.empty_sub}</Text>
          <TouchableOpacity style={[styles.browseBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/products")}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t.cart.browse}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t.cart.title}</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={{ color: "#ef4444", fontSize: 13 }}>{t.cart.clear}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
            ) : (
              <View style={[styles.itemImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                <Feather name="package" size={24} color={colors.mutedForeground} />
              </View>
            )}
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>{format(item.price)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Feather name="minus" size={14} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Feather name="plus" size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={{ marginLeft: 8 }}>
              <Feather name="trash-2" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 120 + bottomPad }} />}
      />
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{t.cart.total}</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>{format(total)}</Text>
        </View>
        <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/checkout")}>
          <Text style={styles.checkoutText}>{t.cart.checkout}</Text>
          <Feather name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 22, fontWeight: "700" },
  browseBtn: { marginTop: 4, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  item: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1 },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  itemName: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 15, fontWeight: "700", minWidth: 20, textAlign: "center" },
  footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  totalLabel: { fontSize: 15 },
  totalValue: { fontSize: 18, fontWeight: "700" },
  checkoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
