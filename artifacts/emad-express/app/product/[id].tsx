import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addItem, items } = useCart();
  const { t, language } = useLanguage();
  const { format, currency } = useCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`),
  });

  const product = data?.product;
  const inCart = items.find(i => i.id === Number(id));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.mutedForeground }}>{t.common.loading}</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.foreground, fontSize: 16 }}>المنتج غير موجود</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ position: "relative" }}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={[styles.heroImage, { marginTop: topPad }]} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginTop: topPad }]}>
              <Feather name="package" size={60} color={colors.mutedForeground} />
            </View>
          )}
          <TouchableOpacity style={[styles.backBtn, { top: topPad + 12, backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Feather name="arrow-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={[styles.productName, { color: colors.foreground, flex: 1, textAlign: language === "ar" ? "right" : "left" }]}>
              {language === "ar" ? (product.name_ar || product.name) : (product.name_en || product.name)}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: product.quantity > 0 ? "#d1fae5" : "#fee2e2" }]}>
              <Text style={{ color: product.quantity > 0 ? "#059669" : "#dc2626", fontSize: 12, fontWeight: "600" }}>
                {product.quantity > 0 ? t.products.in_stock : t.products.out_of_stock}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 12 }}>
            <Text style={[styles.price, { color: colors.primary }]}>{format(product.price, language)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionLabel, { color: colors.foreground, textAlign: language === "ar" ? "right" : "left" }]}>
            {t.product.description}
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground, textAlign: language === "ar" ? "right" : "left" }]}>
            {language === "ar" ? (product.description_ar || product.description) : (product.description_en || product.description)}
          </Text>
          <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoItem}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{language === "ar" ? "كود المنتج" : "SKU"}</Text>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{product.sku || product.id}</Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
            <View style={styles.infoItem}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{language === "ar" ? "الكمية المتاحة" : "Available Stock"}</Text>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{product.quantity}</Text>
            </View>
          </View>
        </View>
        <View style={{ height: bottomPad + 100 }} />
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        {inCart ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={[styles.cartBtn, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => router.push("/(tabs)/cart")}>
              <Feather name="shopping-cart" size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>
                {language === "ar" ? `في السلة (${inCart.quantity})` : `In Cart (${inCart.quantity})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cartBtn, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={() => addItem({ id: product.id, name: language === "ar" ? (product.name_ar || product.name) : (product.name_en || product.name), price: product.price, image: product.image })}>
              <Feather name="plus" size={18} color="#000" />
              <Text style={{ color: "#000", fontWeight: "700", fontSize: 15 }}>
                {language === "ar" ? "إضافة أخرى" : "Add More"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.cartBtn, { backgroundColor: colors.primary }]}
            onPress={() => addItem({ id: product.id, name: language === "ar" ? (product.name_ar || product.name) : (product.name_en || product.name), price: product.price, image: product.image })}
            disabled={product.quantity === 0}>
            <Feather name="shopping-cart" size={18} color="#000" />
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>{t.product.add_to_cart}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: "100%", height: 300 },
  backBtn: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  content: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  productName: { fontSize: 20, fontWeight: "700", lineHeight: 28, flex: 1 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  price: { fontSize: 28, fontWeight: "700" },
  divider: { height: 1, marginVertical: 16 },
  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22 },
  infoRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginTop: 16, overflow: "hidden" },
  infoItem: { flex: 1, padding: 14, gap: 4 },
  infoDivider: { width: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  cartBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
});
