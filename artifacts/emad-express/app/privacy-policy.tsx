import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, isRTL } = useLanguage();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleEmailPress = async () => {
    try {
      await Linking.openURL("mailto:support@emadexpress.com?subject=Privacy%20Policy%20Inquiry%20-%20Emad%20Express");
    } catch {
      // ignore
    }
  };

  const isArabic = language === "ar";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/profile");
            }
          }}
          style={styles.backBtn}
        >
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Branding Badge */}
        <View style={styles.topBadgeContainer}>
          <View style={[styles.shieldIconWrapper, { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.3)" }]}>
            <Feather name="shield" size={32} color="#f59e0b" />
          </View>
          <Text style={[styles.mainTitle, { color: colors.foreground }]}>
            {isArabic ? "سياسة الخصوصية لتطبيق عماد إكسبريس" : "Emad Express Privacy Policy"}
          </Text>
          <Text style={[styles.subBrand, { color: "#f59e0b" }]}>Emad Express</Text>
          <View style={[styles.dateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={13} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {isArabic ? "آخر تحديث: 2026" : "Last updated: 2026"}
            </Text>
          </View>
        </View>

        {/* Introduction Box */}
        <View style={[styles.introCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.introText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {isArabic
              ? "نحن في \"عماد إكسبريس\" نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك عند استخدام تطبيقنا."
              : "At Emad Express, we are committed to protecting our users' privacy. This policy explains how we collect, use, and safeguard your data when using our application."}
          </Text>
        </View>

        {/* Section 1: Data We Collect */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
              <Feather name="database" size={18} color="#3b82f6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "1. البيانات التي نجمعها" : "1. Data We Collect"}
            </Text>
          </View>

          <View style={styles.listContainer}>
            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#3b82f6" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                <Text style={{ fontWeight: "700" }}>{isArabic ? "معلومات الحساب: " : "Account Information: "}</Text>
                {isArabic ? "الاسم، رقم الهاتف، عنوان البريد الإلكتروني." : "Name, phone number, email address."}
              </Text>
            </View>

            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#3b82f6" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                <Text style={{ fontWeight: "700" }}>{isArabic ? "معلومات الطلبات والشحن: " : "Order & Shipping Info: "}</Text>
                {isArabic ? "عنوان التوصيل، تفاصيل الطلبات، وسيلة الدفع المختارة." : "Delivery address, order details, selected payment method."}
              </Text>
            </View>

            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#3b82f6" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                <Text style={{ fontWeight: "700" }}>{isArabic ? "معلومات الجهاز: " : "Device Information: "}</Text>
                {isArabic ? "نوع الجهاز، نظام التشغيل، لتقديم أفضل أداء وتحسين تجربة الاستخدام." : "Device model, operating system to ensure optimal performance and user experience."}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: How We Use Your Data */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <Feather name="activity" size={18} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "2. كيف نستخدم بياناتك" : "2. How We Use Your Data"}
            </Text>
          </View>

          <View style={styles.listContainer}>
            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#10b981" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {isArabic ? "لمعالجة وتوصيل طلبات الشراء إلى عنوانك المحدد بدقة." : "To process and deliver your purchase orders to your specified address accurately."}
              </Text>
            </View>

            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#10b981" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {isArabic ? "لإرسال إشعارات وتنبيهات فورية بحالة الطلب وتحديثات الخدمة." : "To send instant order status notifications and essential service updates."}
              </Text>
            </View>

            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#10b981" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {isArabic ? "لتحسين جودة وأداء التطبيق وتقديم دعم فني متميز للعملاء." : "To optimize app quality, performance, and provide responsive customer support."}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Data Sharing */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Feather name="share-2" size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "3. مشاركة البيانات" : "3. Data Sharing"}
            </Text>
          </View>

          <View style={styles.listContainer}>
            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                <Text style={{ fontWeight: "700" }}>{isArabic ? "الخصوصية أولاً: " : "Privacy First: "}</Text>
                {isArabic ? "لا نقوم ببيع أو تأجير بياناتك الشخصية لأي طرف ثالث على الإطلاق." : "We never sell or rent your personal data to any third parties."}
              </Text>
            </View>

            <View style={[styles.bulletItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.bulletDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={[styles.bulletText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                {isArabic ? "تتم مشاركة بيانات التوصيل الضرورية (الاسم، العنوان، الهاتف) فقط مع مناديب الشحن وشركات التوصيل المعتمدة لغرض إيصال الطلبات." : "Delivery details (name, address, phone) are shared strictly with authorized delivery couriers solely to deliver your orders."}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Data Security */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
              <Feather name="lock" size={18} color="#8b5cf6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "4. أمان البيانات" : "4. Data Security"}
            </Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {isArabic
              ? "نستخدم تقنيات تشفير متطورة وبروتوكولات أمان بمعايير عالمية لحماية كافة بياناتك من الوصول غير المصرح به أو التغيير أو الإفشاء."
              : "We implement advanced encryption standards and high-grade security protocols to protect your personal information from unauthorized access, alteration, or disclosure."}
          </Text>
        </View>

        {/* Section 5: User Rights */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(236, 72, 153, 0.15)" }]}>
              <Feather name="user-check" size={18} color="#ec4899" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "5. حقوق المستخدم" : "5. User Rights"}
            </Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
            {isArabic
              ? "يحق لك في أي وقت تعديل بياناتك أو طلب حذف حسابك وبياناتك نهائياً عبر التواصل معنا مباشرة من داخل التطبيق أو عبر البريد الإلكتروني."
              : "You reserve the right at any time to review, update, or request the permanent deletion of your account and data by contacting us directly inside the app or via email."}
          </Text>
        </View>

        {/* Section 6: Contact Us */}
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: "#f59e0b44" }]}>
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
              <Feather name="mail" size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {isArabic ? "6. للتواصل والاستفسارات" : "6. Contact Us"}
            </Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left", marginBottom: 14 }]}>
            {isArabic
              ? "إذا كانت لديك أي استفسارات أو أسئلة بخصوص سياسة الخصوصية، يسعدنا تواصلك معنا دائماً عبر:"
              : "If you have any questions or inquiries regarding our Privacy Policy, please feel free to reach out to us:"}
          </Text>

          <TouchableOpacity
            style={[styles.emailActionBtn, { backgroundColor: "#f59e0b" }]}
            onPress={handleEmailPress}
            activeOpacity={0.85}
          >
            <Feather name="mail" size={18} color="#000" />
            <Text style={styles.emailActionText}>support@emadexpress.com</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Copyright */}
        <View style={[styles.copyrightContainer, { borderColor: colors.border }]}>
          <Feather name="shield" size={14} color="#f59e0b" />
          <Text style={[styles.copyrightText, { color: colors.mutedForeground }]}>
            © 2026 جميع الحقوق محفوظة لدى <Text style={{ color: "#f59e0b", fontWeight: "700" }}>عماد إكسبريس (Emad Express)</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  topBadgeContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  shieldIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  subBrand: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
  },
  introCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  introText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeaderRow: {
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  listContainer: {
    gap: 10,
  },
  bulletItem: {
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24,
  },
  contactCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  emailActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  emailActionText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
  },
  copyrightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 8,
  },
  copyrightText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
