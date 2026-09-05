import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export type AdSize = "banner" | "largeBanner" | "mediumRectangle";

interface AdBannerProps {
  size?: AdSize;
  style?: object;
  adUnitId?: string;
  bannerIndex?: number;
}

export function AdBanner({ size = "banner", style, bannerIndex = 0 }: AdBannerProps) {
  const colors = useColors();
  const [banners, setBanners] = useState<any[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/banners").catch(() => null),
      api.get("/app-settings").catch(() => null),
    ]).then(([bannersRes, settingsRes]) => {
      if (!mounted) return;
      if (settingsRes?.data?.google_ads_enabled === false) {
        setAdsEnabled(false);
      }
      if (bannersRes?.data && Array.isArray(bannersRes.data)) {
        setBanners(bannersRes.data);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!adsEnabled) return null;

  // If there are partner banners configured in Admin Panel
  if (banners.length > 0) {
    const banner = banners[bannerIndex % banners.length];
    const bannerColor = banner.color || "#f59e0b";

    return (
      <TouchableOpacity
        onPress={() => {
          if (banner.url) {
            Linking.openURL(banner.url).catch(() => {});
          }
        }}
        activeOpacity={0.85}
        style={[
          styles.affiliate,
          { backgroundColor: bannerColor + "15", borderColor: bannerColor + "40" },
          style,
        ]}
      >
        <View style={[styles.dot, { backgroundColor: bannerColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.affiliateTitle, { color: colors.foreground }]} numberOfLines={1}>
            {banner.title}
          </Text>
          {banner.subtitle ? (
            <Text style={[styles.affiliateSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {banner.subtitle}
            </Text>
          ) : null}
        </View>
        {banner.badge ? (
          <View style={[styles.badge, { backgroundColor: bannerColor }]}>
            <Text style={styles.badgeText}>{banner.badge}</Text>
          </View>
        ) : null}
        <Text style={{ color: bannerColor, fontSize: 18, marginStart: 4 }}>›</Text>
      </TouchableOpacity>
    );
  }

  // Fallback banner placeholder
  const heights: Record<AdSize, number> = { banner: 48, largeBanner: 80, mediumRectangle: 200 };
  return (
    <View style={[styles.container, { height: heights[size], borderColor: colors.border + "50" }, style]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        📢 مساحة إعلانية · عماد إكسبرس
      </Text>
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
      onPress={() => Linking.openURL(url).catch(() => {})}
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
    borderWidth: 1, borderStyle: "dashed", borderRadius: 12,
    marginHorizontal: 16,
  },
  label: { fontSize: 11, fontWeight: "600" },
  affiliate: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginVertical: 6,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  affiliateTitle: { fontSize: 13, fontWeight: "700" },
  affiliateSub: { fontSize: 11, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
