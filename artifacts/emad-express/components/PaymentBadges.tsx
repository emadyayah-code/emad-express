import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";

export function VisaBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.visaBg, isSm && styles.badgeSm]}>
      <Text style={[styles.visaText, isSm && { fontSize: 10 }]}>VISA</Text>
      <View style={styles.visaGoldMark} />
    </View>
  );
}

export function MasterCardBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  const circleSize = isSm ? 12 : 16;
  return (
    <View style={[styles.badgeBase, styles.mcBg, isSm && styles.badgeSm]}>
      <View style={styles.mcCircles}>
        <View style={[styles.mcRed, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]} />
        <View style={[styles.mcOrange, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, marginLeft: -circleSize * 0.45 }]} />
      </View>
      {!isSm && <Text style={styles.mcText}>mastercard</Text>}
    </View>
  );
}

export function MadaBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.madaBg, isSm && styles.badgeSm]}>
      <View style={styles.madaDot} />
      <Text style={[styles.madaText, isSm && { fontSize: 9 }]}>mada مدى</Text>
    </View>
  );
}

export function AmexBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.amexBg, isSm && styles.badgeSm]}>
      <Text style={[styles.amexText, isSm && { fontSize: 9 }]}>AMEX</Text>
    </View>
  );
}

export function DiscoverBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.discoverBg, isSm && styles.badgeSm]}>
      <Text style={[styles.discoverText, isSm && { fontSize: 9 }]}>DISCOVER</Text>
    </View>
  );
}

export function PayPalBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.paypalBg, isSm && styles.badgeSm]}>
      <View style={styles.paypalP}>
        <Text style={{ color: "#0079C1", fontWeight: "900", fontSize: isSm ? 11 : 14 }}>P</Text>
        <Text style={{ color: "#00457C", fontWeight: "900", fontSize: isSm ? 11 : 14, marginLeft: -4 }}>P</Text>
      </View>
      <Text style={[styles.paypalText, isSm && { fontSize: 10 }]}>PayPal</Text>
    </View>
  );
}

export function ApplePayBadge({ size = "normal" }: { size?: "small" | "normal" | "large" }) {
  const isSm = size === "small";
  return (
    <View style={[styles.badgeBase, styles.appleBg, isSm && styles.badgeSm]}>
      <FontAwesome5 name="apple" size={isSm ? 10 : 13} color="#fff" />
      <Text style={[styles.appleText, isSm && { fontSize: 10 }]}>Pay</Text>
    </View>
  );
}

export function AcceptedCardsRow() {
  return (
    <View style={styles.cardsRow}>
      <PayPalBadge size="small" />
      <VisaBadge size="small" />
      <MasterCardBadge size="small" />
      <MadaBadge size="small" />
      <AmexBadge size="small" />
      <ApplePayBadge size="small" />
    </View>
  );
}

export function detectCardBrand(num: string): {
  brand: string;
  badge: "visa" | "mastercard" | "mada" | "amex" | "discover" | "unknown";
  color: string;
} {
  const clean = (num || "").replace(/\s/g, "");
  if (clean.startsWith("4")) {
    // Saudi Mada BIN ranges starting with 4 (e.g. 400861, 401757, 455708, etc.)
    if (/^(400861|401757|417633|446393|457865|457997|474491|484783|440647|440795|446404|457865)/.test(clean)) {
      return { brand: "مدى Mada", badge: "mada", color: "#008444" };
    }
    return { brand: "VISA", badge: "visa", color: "#00579f" };
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    // Saudi Mada BIN ranges starting with 5 (e.g. 588845, 588846, etc.)
    if (/^(588845|588846|588847|588848|588849|588850|588851|535825|543357|524130|529415)/.test(clean)) {
      return { brand: "مدى Mada", badge: "mada", color: "#008444" };
    }
    return { brand: "MasterCard", badge: "mastercard", color: "#eb001b" };
  }
  if (/^3[47]/.test(clean)) {
    return { brand: "American Express", badge: "amex", color: "#006fcf" };
  }
  if (/^(6011|65|64[4-9]|622)/.test(clean)) {
    return { brand: "Discover", badge: "discover", color: "#ff6000" };
  }
  if (/^(9682|604906|636120)/.test(clean)) {
    return { brand: "مدى Mada", badge: "mada", color: "#008444" };
  }
  return { brand: "بطاقة بنكية معتمدة", badge: "unknown", color: "#f59e0b" };
}

export function DynamicCardBrandBadge({ brandType }: { brandType: string }) {
  switch (brandType) {
    case "visa":
      return <VisaBadge size="normal" />;
    case "mastercard":
      return <MasterCardBadge size="normal" />;
    case "mada":
      return <MadaBadge size="normal" />;
    case "amex":
      return <AmexBadge size="normal" />;
    case "discover":
      return <DiscoverBadge size="normal" />;
    default:
      return <VisaBadge size="normal" />;
  }
}

const styles = StyleSheet.create({
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  badgeBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  visaBg: {
    backgroundColor: "#0d2b6b",
    borderWidth: 1,
    borderColor: "#1a4499",
  },
  visaText: {
    color: "#ffffff",
    fontWeight: "900",
    fontStyle: "italic",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  visaGoldMark: {
    width: 3,
    height: 3,
    backgroundColor: "#fbbf24",
    borderRadius: 1.5,
    marginLeft: 2,
    marginBottom: 4,
  },
  mcBg: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    gap: 4,
  },
  mcCircles: {
    flexDirection: "row",
    alignItems: "center",
  },
  mcRed: {
    backgroundColor: "#eb001b",
    opacity: 0.95,
  },
  mcOrange: {
    backgroundColor: "#f79e1b",
    opacity: 0.95,
  },
  mcText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  madaBg: {
    backgroundColor: "#064e3b",
    borderWidth: 1,
    borderColor: "#059669",
    gap: 4,
  },
  madaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#34d399",
  },
  madaText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  amexBg: {
    backgroundColor: "#006fcf",
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  amexText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  discoverBg: {
    backgroundColor: "#c2410c",
    borderWidth: 1,
    borderColor: "#fb923c",
  },
  discoverText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  paypalBg: {
    backgroundColor: "#003087",
    borderWidth: 1,
    borderColor: "#0079c1",
    gap: 3,
  },
  paypalP: {
    flexDirection: "row",
  },
  paypalText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: -0.2,
  },
  appleBg: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#334155",
    gap: 3,
  },
  appleText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
  },
});
