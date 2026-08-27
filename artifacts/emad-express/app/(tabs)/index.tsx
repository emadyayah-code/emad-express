import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Platform, Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { LinearGradient } from "expo-linear-gradient";
import { AdBanner } from "@/components/AdBanner";

const logoImg = require("@/assets/images/logo.png");

const CATEGORIES_ICONS: Record<string, string> = {
  "هواتف ذكية": "📱",
  "أجهزة كمبيوتر": "💻",
  "سماعات": "🎧",
  "تلفزيونات": "📺",
  "كاميرات": "📷",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addItem, count } = useCart();
  const { t, language } = useLanguage();
  const { format } = useCurrency();

  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: () => api.get("/products") });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/categories") });

  const products = productsData?.data || [];
  const featured = products.slice(0, 4);
  const topSelling = products.slice(2, 6);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isRTL = language === "ar";

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#0a0a0a", "#1a1000", "#0a0a0a"]} style={[styles.heroSection, { paddingTop: topPad + 10, paddingBottom: 10 }]}>
        <View style={styles.headerRow}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity onPress={() => router.push("/(tabs)/cart")} style={[styles.cartBtn, { backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }]}>
            <Feather name="shopping-cart" size={20} color="#f59e0b" />
            {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Google AdMob Banner — Top */}
      <View style={{ marginTop: 12 }}>
        <AdBanner size="banner" />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.categories}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/products")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t.home.see_all}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={categories || []}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/(tabs)/products", params: { category_id: item.id } })}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.catImage} resizeMode="cover" />
              ) : (
                <View style={[styles.catImage, { alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }]}>
                  <Text style={styles.catIcon}>{item.icon || CATEGORIES_ICONS[item.name] || "📦"}</Text>
                </View>
              )}
              <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        />
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.featured}</Text>
        </View>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={featured}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                  <Feather name="package" size={32} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: colors.primary }]}>{format(item.price)}</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => addItem({ id: item.id, name: item.name, price: item.price, image: item.image })}>
                  <Feather name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        />
      </View>

      {/* AdMob Banner — Middle */}
      <View style={{ marginVertical: 8 }}>
        <AdBanner size="banner" />
      </View>

      {/* Best Sellers */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.best_sellers}</Text>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {topSelling.map((item: any) => (
            <TouchableOpacity key={item.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.listImage} resizeMode="cover" />
              ) : (
                <View style={[styles.listImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                  <Feather name="package" size={24} color={colors.mutedForeground} />
                </View>
              )}
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.listName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.listDesc, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{item.description}</Text>
              </View>
              <Text style={[styles.listPrice, { color: colors.primary }]}>{format(item.price)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 + 84 : insets.bottom + 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  logo: { height: 50, width: 180 },
  cartBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  bannerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, padding: 16, backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" },
  bannerContent: { flex: 1 },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 24, marginBottom: 4 },
  bannerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 },
  bannerBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, alignSelf: "flex-start", backgroundColor: "#f59e0b" },
  bannerBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
  bannerEmoji: { fontSize: 52, marginLeft: 8 },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12, marginTop: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  adLabel: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  catCard: { alignItems: "center", padding: 8, borderRadius: 14, borderWidth: 1, width: 90 },
  catImage: { width: 72, height: 72, borderRadius: 36, marginBottom: 6 },
  catIcon: { fontSize: 30 },
  catName: { fontSize: 12, fontWeight: "600", textAlign: "center", maxWidth: 80 },
  productCard: { width: 165, borderRadius: 14, overflow: "hidden", borderWidth: 1 },
  productImage: { width: "100%", height: 140 },
  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: "600", lineHeight: 18, marginBottom: 6 },
  productPrice: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  // Partner deals
  dealCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  dealDot: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dealTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  dealSub: { fontSize: 12 },
  dealBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dealBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  // Best sellers list
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1 },
  listImage: { width: 56, height: 56, borderRadius: 10 },
  listName: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  listDesc: { fontSize: 12 },
  listPrice: { fontSize: 15, fontWeight: "700" },
});
