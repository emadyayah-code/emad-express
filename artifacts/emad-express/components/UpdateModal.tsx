import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { CURRENT_APP_VERSION, compareAppVersions } from "@/constants/version";

const DISMISSED_KEY_PREFIX = "@emad_update_dismissed_";

export function UpdateModal({
  forceVisible,
  onCloseManual,
}: {
  forceVisible?: boolean;
  onCloseManual?: () => void;
}) {
  const colors = useColors();
  const { language } = useLanguage();
  const settings = useAppSettings();

  const [dismissed, setDismissed] = useState(false);

  const isRTL = language === "ar";
  const latestVersion = settings.latest_version || settings.app_version || CURRENT_APP_VERSION;
  const minVersion = settings.min_version || "1.0.0";
  const updateEnabled = settings.update_enabled !== false;

  const hasNewerVersion = compareAppVersions(latestVersion, CURRENT_APP_VERSION) > 0;
  const isForced =
    Boolean(settings.force_update) ||
    compareAppVersions(minVersion, CURRENT_APP_VERSION) > 0;

  // Check if previously snoozed for this version
  useEffect(() => {
    if (!hasNewerVersion || isForced) {
      setDismissed(false);
      return;
    }

    AsyncStorage.getItem(`${DISMISSED_KEY_PREFIX}${latestVersion}`)
      .then((savedTime) => {
        if (savedTime) {
          const hoursAgo = (Date.now() - parseInt(savedTime, 10)) / (1000 * 60 * 60);
          // Snooze for 24 hours
          if (hoursAgo < 24) {
            setDismissed(true);
          }
        }
      })
      .catch(() => {});
  }, [latestVersion, hasNewerVersion, isForced]);

  const isVisible =
    Boolean(forceVisible) ||
    (updateEnabled && hasNewerVersion && (!dismissed || isForced));

  if (!isVisible) return null;

  const title =
    settings.update_title ||
    (isRTL ? "تحديث جديد متوفر للتطبيق 🚀" : "New App Update Available 🚀");

  const notes =
    settings.update_notes ||
    (isRTL
      ? "يتوفر إصدار جديد يحتوي على تحسينات في السرعة والأداء وتجربة الشراء وإصلاحات مهمة لضمان أفضل تجربة لك."
      : "A new version is available with performance improvements, bug fixes, and new features for the best shopping experience.");

  const updateUrl =
    settings.update_url ||
    (Platform.OS === "android"
      ? "https://play.google.com/store/apps/details?id=com.emadexpress.app"
      : "https://apps.apple.com/app/idcom.emadexpress.app");

  async function handleUpdate() {
    try {
      const supported = await Linking.canOpenURL(updateUrl).catch(() => true);
      if (supported) {
        await Linking.openURL(updateUrl);
      } else {
        await Linking.openURL("https://play.google.com/store/apps/details?id=com.emadexpress.app");
      }
    } catch {
      Alert.alert(
        isRTL ? "تنبيه" : "Notice",
        isRTL
          ? "يرجى زيارة متجر التطبيقات لتحديث عماد إكسبرس."
          : "Please visit the app store to update Emad Express."
      );
    }
  }

  function handleDismiss() {
    if (onCloseManual) {
      onCloseManual();
    }
    setDismissed(true);
    AsyncStorage.setItem(`${DISMISSED_KEY_PREFIX}${latestVersion}`, Date.now().toString()).catch(
      () => {}
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isForced) handleDismiss();
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderColor: isForced ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.4)",
            },
          ]}
        >
          {/* Top Decorative Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconGlow,
                {
                  backgroundColor: isForced
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(245, 158, 11, 0.2)",
                },
              ]}
            >
              <Feather
                name={isForced ? "alert-triangle" : "arrow-up-circle"}
                size={38}
                color={isForced ? "#ef4444" : "#f59e0b"}
              />
            </View>
          </View>

          {/* Badges: Current Version -> New Version */}
          <View style={styles.versionRow}>
            <View style={[styles.verBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.verText, { color: colors.mutedForeground }]}>
                {isRTL ? "الحالي:" : "Current:"} v{CURRENT_APP_VERSION}
              </Text>
            </View>
            <Feather
              name={isRTL ? "arrow-left" : "arrow-right"}
              size={14}
              color={colors.mutedForeground}
            />
            <View style={[styles.verBadge, { backgroundColor: "rgba(245,158,11,0.15)", borderColor: "#f59e0b" }]}>
              <Text style={[styles.verText, { color: "#f59e0b", fontWeight: "700" }]}>
                {isRTL ? "الجديد:" : "New:"} v{latestVersion}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {title}
          </Text>

          {/* Forced badge if required */}
          {isForced && (
            <View style={styles.forcedBanner}>
              <Feather name="shield" size={14} color="#ef4444" />
              <Text style={styles.forcedText}>
                {isRTL
                  ? "تحديث إلزامي لمواصلة استخدام التطبيق بأمان"
                  : "Required update to continue using the app safely"}
              </Text>
            </View>
          )}

          {/* What's New / Release Notes Box */}
          <View
            style={[
              styles.notesBox,
              { backgroundColor: "rgba(255,255,255,0.03)", borderColor: colors.border },
            ]}
          >
            <View style={[styles.notesHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="zap" size={14} color="#f59e0b" />
              <Text style={[styles.notesTitle, { color: "#f59e0b" }]}>
                {isRTL ? "ما الجديد في هذا التحديث؟" : "What's New in this update?"}
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 120 }}>
              <Text
                style={[
                  styles.notesText,
                  { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {notes}
              </Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: "#f59e0b",
                },
              ]}
              onPress={handleUpdate}
            >
              <Feather name="download-cloud" size={18} color="#000" />
              <Text style={styles.primaryBtnText}>
                {isRTL ? "تحديث التطبيق الآن" : "Update App Now"}
              </Text>
            </TouchableOpacity>

            {!isForced && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleDismiss}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>
                  {isRTL ? "لاحقاً، ذكرني غداً" : "Later, remind me tomorrow"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  verBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  verText: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    lineHeight: 26,
    width: "100%",
  },
  forcedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
  },
  forcedText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  notesBox: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  notesHeader: {
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
