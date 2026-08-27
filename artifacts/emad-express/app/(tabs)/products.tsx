import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Platform, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category_id?: string }>();
  const { addItem } = useCart();
  const { t, language, isRTL } = useLanguage();
  const { format } = useCurrency();

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(params.category_id ? parseInt(params.category_id) : null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCat],
    queryFn: () => api.get(`/products${selectedCat ? `?category_id=${selectedCat}` : ""}`),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/categories") });

  const allProducts = productsData?.data || [];
  const filtered = search
    ? allProducts.filter((p: any) => {
        const name = (language === "ar" ? (p.name_ar || p.name) : (p.name_en || p.name)).toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : allProducts;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
          {t.products.title}
        </Text>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border, flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.products.search_placeholder}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          />
        </View>
      </View>

      <View style={{ backgroundColor: colors.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedCat(null)}
            style={[styles.catPill, { backgroundColor: !selectedCat ? colors.primary : colors.muted }]}
          >
            <Text style={[styles.catPillText, { color: !selectedCat ? "#000" : colors.mutedForeground, fontWeight: "700" }]}>
              {t.products.all}
            </Text>
          </TouchableOpacity>
          {(categories || []).map((c: any) => {
            const catName = language === "ar" ? (c.name_ar || c.name) : (c.name_en || c.name);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCat(c.id)}
                style={[styles.catPill, { backgroundColor: selectedCat === c.id ? colors.primary : colors.muted }]}
              >
                <Text style={[styles.catPillText, { color: selectedCat === c.id ? "#000" : colors.mutedForeground, fontWeight: "700" }]}>
                  {catName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.mutedForeground }}>{t.common?.loading || "..."}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 16 }}>{t.products.no_products}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const displayName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
            return (
              <TouchableOpacity
                style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                    <Feather name="package" size={32} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                    {displayName}
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>{format(item.price, language)}</Text>
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: colors.primary }]}
                      onPress={() => addItem({ id: item.id, name: displayName, price: item.price, image: item.image })}
                    >
                      <Feather name="plus" size={14} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
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
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, textAlign: "right" },
  catPill: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20 },
  catPillText: { fontSize: 13, fontWeight: "600" },
  productCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1 },
  productImage: { width: "100%", height: 130 },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  productPrice: { fontSize: 14, fontWeight: "700" },
  addBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
