/**
 * AdBanner — مساحة إعلانية
 *
 * يعرض placeholder حالياً. لتفعيل AdMob الحقيقي:
 * 1. سجّل في https://admob.google.com واحصل على App ID + Ad Unit IDs
 * 2. أضف الـ App ID في app.json > plugins > react-native-google-mobile-ads
 * 3. استبدل TEST_BANNER_ID بـ Ad Unit ID الحقيقي
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useColors } from "@/hooks/useColors";

export type AdSize = "banner" | "largeBanner" | "mediumRectangle";

interface AdBannerProps {
  size?: AdSize;
  style?: object;
  adUnitId?: string;
}

export function AdBanner({ size = "banner", style }: AdBannerProps) {
  const colors = useColors();
  const heights: Record<AdSize, number> = { banner: 52, largeBanner: 100, mediumRectangle: 250 };

  return (
    <View style={[styles.container, { height: heights[size], borderColor: colors.border + "60" }, style]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>📢 مساحة إعلانية · Google AdMob</Text>
    </View>
  );
}

interface AffiliateBannerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  url: string;
  style?: object;
}

export function AffiliateBanner({ title, subtitle, badge, color = "#f59e0b", url, style }: AffiliateBannerProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.85}
      style={[styles.affiliate, { backgroundColor: color + "18", borderColor: color + "44" }, style]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.affiliateTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.affiliateSub, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {badge && <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.badgeText}>{badge}</Text></View>}
      <Text style={{ color, fontSize: 18, marginStart: 4 }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderStyle: "dashed", borderRadius: 8,
    marginHorizontal: 16,
  },
  label: { fontSize: 11, fontWeight: "500" },
  affiliate: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginVertical: 6,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  affiliateTitle: { fontSize: 14, fontWeight: "700" },
  affiliateSub: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
