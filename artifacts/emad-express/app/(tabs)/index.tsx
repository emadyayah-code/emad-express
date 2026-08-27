import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Platform, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useFavorites } from "@/context/FavoritesContext";
import { LinearGradient } from "expo-linear-gradient";
import { AdBanner } from "@/components/AdBanner";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = Math.min(SCREEN_WIDTH - 32, 480);

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
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const { data: productsData } = useQuery({ queryKey: ["products", language], queryFn: () => api.get(`/products?lang=${language}`) });
  const { data: categoriesData } = useQuery({ queryKey: ["categories", language], queryFn: () => api.get("/categories") });

  const products = Array.isArray(productsData) ? productsData : (productsData?.data || productsData?.products || []);
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  const showcaseProducts = products.slice(0, 6);
  const featured = products.slice(0, 6);
  const topSelling = products.slice(6, 12);

  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);

  // Auto-play animated carousel
  useEffect(() => {
    if (showcaseProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % showcaseProducts.length;
        try {
          sliderRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {}
        return next;
      });
    }, 3800);
    return () => clearInterval(timer);
  }, [showcaseProducts.length]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isRTL = language === "ar";

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#0a0a0a", "#1a1000", "#0a0a0a"]} style={[styles.heroSection, { paddingTop: topPad + 10, paddingBottom: 16 }]}>
        <View style={styles.headerRow}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={() => router.push("/favorites")} style={[styles.cartBtn, { backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }]}>
              <Feather name="heart" size={19} color="#ef4444" />
              {favorites.length > 0 && (
                <View style={[styles.badge, { backgroundColor: "#ef4444" }]}>
                  <Text style={styles.badgeText}>{favorites.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/cart")} style={[styles.cartBtn, { backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }]}>
              <Feather name="shopping-bag" size={19} color="#f59e0b" />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Animated Showcase Carousel */}
        {showcaseProducts.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <FlatList
              ref={sliderRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              data={showcaseProducts}
              keyExtractor={(item: any) => `showcase-${item.id}`}
              snapToInterval={SLIDE_WIDTH + 12}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (SLIDE_WIDTH + 12));
                if (index >= 0 && index < showcaseProducts.length) {
                  setActiveSlide(index);
                }
              }}
              getItemLayout={(_, index) => ({
                length: SLIDE_WIDTH + 12,
                offset: (SLIDE_WIDTH + 12) * index,
                index,
              })}
              renderItem={({ item }) => {
                const displayName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
                    style={[
                      styles.showcaseCard,
                      { width: SLIDE_WIDTH, backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(245,158,11,0.25)" },
                    ]}
                  >
                    <View style={{ flex: 1.2, padding: 14, justifyContent: "space-between" }}>
                      <View>
                        <View style={styles.showcaseBadge}>
                          <Text style={styles.showcaseBadgeText}>
                            {language === "ar" ? "✨ منتج مميز" : "✨ Featured"}
                          </Text>
                        </View>
                        <Text style={[styles.showcaseTitle, { color: "#fff", textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                          {displayName}
                        </Text>
                      </View>

                      <View>
                        <Text style={[styles.showcasePrice, { color: "#f59e0b" }]}>{format(item.price, language)}</Text>
                        <View style={styles.showcaseShopBtn}>
                          <Text style={styles.showcaseShopText}>
                            {language === "ar" ? "عرض المنتج" : "View"}
                          </Text>
                          <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={14} color="#000" />
                        </View>
                      </View>
                    </View>

                    <View style={styles.showcaseImageWrap}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.showcaseImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.showcaseImage, { backgroundColor: "#1f1f1f", alignItems: "center", justifyContent: "center" }]}>
                          <Feather name="package" size={40} color="#666" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ gap: 12 }}
            />

            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {showcaseProducts.map((_: any, i: number) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.dot,
                    {
                      width: activeSlide === i ? 22 : 6,
                      backgroundColor: activeSlide === i ? "#f59e0b" : "rgba(255,255,255,0.2)",
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}
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
          renderItem={({ item }: { item: any }) => {
            const catName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
            return (
              <TouchableOpacity style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/(tabs)/products", params: { category_id: item.id } })}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.catImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.catImage, { alignItems: "center", justifyContent: "center", backgroundColor: colors.muted }]}>
                    <Text style={styles.catIcon}>{item.icon || CATEGORIES_ICONS[item.name] || "📦"}</Text>
                  </View>
                )}
                <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>{catName}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        />
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.featured}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/products")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t.home.see_all}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={featured}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={({ item }: { item: any }) => {
            const displayName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
            const isFav = isFavorite(item.id);
            return (
              <TouchableOpacity style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}>
                <View style={{ position: "relative" }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="package" size={32} color={colors.mutedForeground} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.favCardBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFavorite({
                        id: item.id,
                        name: item.name,
                        name_ar: item.name_ar,
                        name_en: item.name_en,
                        price: item.price,
                        image: item.image,
                        category_id: item.category_id,
                      });
                    }}
                  >
                    <Feather name="heart" size={14} color={isFav ? "#ef4444" : "#fff"} />
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>{displayName}</Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>{format(item.price, language)}</Text>
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => addItem({ id: item.id, name: displayName, price: item.price, image: item.image })}>
                    <Feather name="plus" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
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
          <TouchableOpacity onPress={() => router.push("/(tabs)/products")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t.home.see_all}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {topSelling.map((item: any) => {
            const displayName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
            const displayDesc = language === "ar" ? (item.description_ar || item.description) : (item.description_en || item.description);
            return (
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
                  <Text style={[styles.listName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{displayName}</Text>
                  <Text style={[styles.listDesc, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{displayDesc}</Text>
                </View>
                <Text style={[styles.listPrice, { color: colors.primary }]}>{format(item.price, language)}</Text>
              </TouchableOpacity>
            );
          })}
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
  showcaseCard: { flexDirection: "row", borderRadius: 18, overflow: "hidden", borderWidth: 1, height: 165 },
  showcaseBadge: { alignSelf: "flex-start", backgroundColor: "rgba(245,158,11,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", marginBottom: 6 },
  showcaseBadgeText: { color: "#f59e0b", fontSize: 10, fontWeight: "700" },
  showcaseTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 6 },
  showcasePrice: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  showcaseShopBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f59e0b", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: "flex-start" },
  showcaseShopText: { color: "#000", fontSize: 11, fontWeight: "700" },
  showcaseImageWrap: { flex: 1, backgroundColor: "#141414" },
  showcaseImage: { width: "100%", height: "100%" },
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
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
  favCardBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
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
