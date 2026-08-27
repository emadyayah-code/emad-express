import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();
  const { addItem } = useCart();
  const { t, language, isRTL } = useLanguage();
  const { format } = useCurrency();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>المفضلة ({favorites.length})</Text>
        <View style={{ width: 38 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: "#ef444415" }]}>
            <Feather name="heart" size={48} color="#ef4444" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>قائمة المفضلة فارغة</Text>
          <Text style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 14, paddingHorizontal: 40 }}>
            اضغط على أيقونة القلب على أي منتج يعجبك لحفظه هنا والرجوع إليه في أي وقت!
          </Text>
          <TouchableOpacity style={[styles.shopBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/products")}>
            <Feather name="shopping-bag" size={18} color="#000" />
            <Text style={styles.shopBtnText}>تصفح المنتجات الآن</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(item) => "fav-" + item.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item }) => {
            const displayName = language === "ar" ? (item.name_ar || item.name) : (item.name_en || item.name);
            return (
              <TouchableOpacity
                style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
                activeOpacity={0.85}
              >
                <View style={{ position: "relative" }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.productImage, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="package" size={32} color={colors.mutedForeground} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => removeFavorite(item.id)}
                  >
                    <Feather name="heart" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]} numberOfLines={2}>
                    {displayName}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>{format(item.price, language)}</Text>
                  <TouchableOpacity
                    style={[styles.addCartBtn, { backgroundColor: colors.primary }]}
                    onPress={() => addItem({ id: item.id, name: displayName, price: item.price, image: item.image })}
                  >
                    <Feather name="shopping-cart" size={14} color="#000" />
                    <Text style={styles.addCartText}>إضافة للسلة</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: bottomPad + 30 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingBottom: 60 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  shopBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginTop: 10 },
  shopBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  productCard: { flex: 1, margin: 5, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  productImage: { width: "100%", height: 140 },
  heartBtn: { position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  productInfo: { padding: 10, gap: 6 },
  productName: { fontSize: 13, fontWeight: "600" },
  productPrice: { fontSize: 15, fontWeight: "800" },
  addCartBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  addCartText: { color: "#000", fontWeight: "700", fontSize: 12 },
});