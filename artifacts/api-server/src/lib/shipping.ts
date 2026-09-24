import { db, shipping_carriers, shipments, orders } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { convertCurrency } from "./currency";

export interface ShippingOption {
  id: "dhl" | "economic" | "standard" | "premium";
  carrier: string;
  nameAr: string;
  nameEn: string;
  cost: number;
  originalCostSar: number;
  currency: string;
  isFree: boolean;
  estimatedDays: string;
  descriptionAr: string;
  descriptionEn: string;
  isDefault: boolean;
}

export interface CalculateShippingInput {
  subtotal: number;
  address?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  method?: string;
  currency?: string;
}

export interface ShippingCalculationResult {
  isYemen: boolean;
  isSaudi: boolean;
  destinationCountry: string;
  detectedCity: string;
  selectedOption: ShippingOption;
  availableOptions: ShippingOption[];
  shippingFee: number;
  tax: number;
  grandTotal: number;
}

const YEMEN_KEYWORDS = [
  "اليمن", "yemen", "ye", "تعز", "taiz", "صنعاء", "sana'a", "sanaa", "sana",
  "عدن", "aden", "حضرموت", "hadramout", "hadhramaut", "الحديدة", "hodeidah", "hodeida",
  "إب", "ibb", "ذمار", "dhamar", "مأرب", "marib", "شبوة", "shabwa", "shabwah",
  "المهرة", "al mahrah", "mahrah", "لحج", "lahj", "أبين", "abyan", "صعدة", "saada",
  "حجة", "hajjah", "عمران", "amran", "الضالع", "dhale", "dalea", "ريمة", "raymah",
  "سقطرى", "socotra", "المكلا", "mukalla", "سيئون", "seiyun"
];

const SAUDI_KEYWORDS = [
  "السعودية", "المملكة العربية السعودية", "saudi", "sa", "ksa",
  "الرياض", "riyadh", "جدة", "jeddah", "الدمام", "dammam", "مكة", "makkah", "mecca",
  "المدينة", "madinah", "medina", "الخبر", "khobar", "تبوك", "tabuk", "أبها", "abha",
  "خميس مشيط", "khamis", "جازان", "jazan", "نجران", "najran", "حائل", "hail",
  "القصيم", "qassim", "بريدة", "buraidah", "عنيزة", "onaizah", "الجبيل", "jubail",
  "ينبع", "yanbu", "الطائف", "taif", "الهفوف", "hofuf", "الأحساء", "ahsa"
];

export function isYemenDestination(address: string = "", country: string = "", countryCode: string = ""): boolean {
  if (countryCode?.toUpperCase() === "YE") return true;
  const combined = `${country} ${countryCode} ${address}`.toLowerCase();
  return YEMEN_KEYWORDS.some(k => combined.includes(k));
}

export function isSaudiDestination(address: string = "", country: string = "", countryCode: string = ""): boolean {
  if (countryCode?.toUpperCase() === "SA") return true;
  const combined = `${country} ${countryCode} ${address}`.toLowerCase();
  return SAUDI_KEYWORDS.some(k => combined.includes(k));
}

export function detectCity(address: string = ""): string {
  const allCities = [
    { name: "تعز", pattern: /تعز|taiz/i },
    { name: "صنعاء", pattern: /صنعاء|sana/i },
    { name: "عدن", pattern: /عدن|aden/i },
    { name: "حضرموت", pattern: /حضرموت|hadramout|المكلا|mukalla|سيئون|seiyun/i },
    { name: "الحديدة", pattern: /الحديدة|hodeida/i },
    { name: "إب", pattern: /إب|ibb/i },
    { name: "ذمار", pattern: /ذمار|dhamar/i },
    { name: "مأرب", pattern: /مأرب|marib/i },
    { name: "الرياض", pattern: /الرياض|riyadh/i },
    { name: "جدة", pattern: /جدة|jeddah/i },
    { name: "الدمام", pattern: /الدمام|dammam/i },
    { name: "مكة المكرمة", pattern: /مكة|makkah/i },
    { name: "المدينة المنورة", pattern: /المدينة|madinah/i },
  ];
  for (const c of allCities) {
    if (c.pattern.test(address)) return c.name;
  }
  return "";
}

export async function calculateAliExpressShipping(input: CalculateShippingInput): Promise<ShippingCalculationResult> {
  const { subtotal = 0, address = "", country = "", countryCode = "", method, currency = "SAR" } = input;
  const isYemen = isYemenDestination(address, country, countryCode);
  const isSaudi = isSaudiDestination(address, country, countryCode);
  const detectedCity = input.city || detectCity(address);
  const destinationCountry = isYemen ? "YE" : isSaudi ? "SA" : (countryCode || country || "GLOBAL");

  // Determine subtotal in SAR for threshold calculations
  let subtotalSar = subtotal;
  if (currency !== "SAR") {
    try {
      subtotalSar = await convertCurrency(subtotal, currency, "SAR");
    } catch {
      subtotalSar = subtotal;
    }
  }

  const availableOptions: ShippingOption[] = [];

  if (isYemen) {
    // 1. DHL Express - Official AliExpress direct method to Yemen
    const dhlCostSar = 529;
    const dhlCost = currency === "SAR" ? dhlCostSar : await convertCurrency(dhlCostSar, "SAR", currency);
    availableOptions.push({
      id: "dhl",
      carrier: "DHL Express",
      nameAr: "دي إتش إل إكسبريس (DHL Express - علي إكسبرس)",
      nameEn: "DHL Express (AliExpress Yemen Direct)",
      cost: dhlCost,
      originalCostSar: dhlCostSar,
      currency,
      isFree: false,
      estimatedDays: "7-15 يوم عمل",
      descriptionAr: "شحن جوي دولي سريع ومباشر إلى اليمن عبر DHL Express (شحن علي إكسبرس الرسمي)",
      descriptionEn: "Fast direct international air express to Yemen via DHL Express",
      isDefault: true,
    });

    // 2. Economic Combined Freight to Yemen
    const ecoCostSar = 25;
    const ecoCost = currency === "SAR" ? ecoCostSar : await convertCurrency(ecoCostSar, "SAR", currency);
    availableOptions.push({
      id: "economic",
      carrier: "AliExpress Economic Freight",
      nameAr: "شحن اقتصادي مجمّع (AliExpress Combined Freight)",
      nameEn: "AliExpress Combined Economic Shipping",
      cost: ecoCost,
      originalCostSar: ecoCostSar,
      currency,
      isFree: false,
      estimatedDays: "20-35 يوم عمل",
      descriptionAr: "شحن اقتصادي موفّر بالتجميع والتسليم في المحافظات اليمنية",
      descriptionEn: "Economical consolidated freight delivery to Yemen",
      isDefault: false,
    });
  } else {
    // Rest of the World (Saudi Arabia, GCC, Worldwide)
    // 1. AliExpress Choice / Standard Shipping
    const isFree = subtotalSar >= 100;
    const stdCostSar = isFree ? 0 : 15;
    const stdCost = isFree ? 0 : (currency === "SAR" ? stdCostSar : await convertCurrency(stdCostSar, "SAR", currency));
    availableOptions.push({
      id: "standard",
      carrier: "AliExpress Standard Shipping",
      nameAr: isFree ? "شحن مجاني علي إكسبرس (AliExpress Choice)" : "شحن قياسي علي إكسبرس (AliExpress Standard)",
      nameEn: isFree ? "AliExpress Choice (Free Shipping)" : "AliExpress Standard Shipping",
      cost: stdCost,
      originalCostSar: stdCostSar,
      currency,
      isFree,
      estimatedDays: "10-18 يوم عمل",
      descriptionAr: isFree
        ? "شحن مجاني رسمي على مشترياتك بقيمة 100 ر.س فأكثر (خدمة AliExpress Choice)"
        : "شحن قياسي دولي موثوق مع رقم تتبع (شحن مجاني عند الشراء بـ 100 ر.س فأكثر)",
      descriptionEn: isFree
        ? "Free shipping on orders 100 SAR+ (AliExpress Choice)"
        : "Standard international tracked shipping (Free on 100 SAR+)",
      isDefault: true,
    });

    // 2. AliExpress Premium Express Shipping
    const premCostSar = 45;
    const premCost = currency === "SAR" ? premCostSar : await convertCurrency(premCostSar, "SAR", currency);
    availableOptions.push({
      id: "premium",
      carrier: "AliExpress Premium Shipping",
      nameAr: "شحن سريع بريميوم (AliExpress Premium)",
      nameEn: "AliExpress Premium Express",
      cost: premCost,
      originalCostSar: premCostSar,
      currency,
      isFree: false,
      estimatedDays: "5-9 أيام عمل",
      descriptionAr: "شحن جوي سريع بأعلى أولوية وتسليم للباب",
      descriptionEn: "High-priority express air shipping with direct door delivery",
      isDefault: false,
    });
  }

  // Selected Option based on method parameter or default
  let selectedOption = availableOptions.find(o => o.id === method);
  if (!selectedOption) {
    selectedOption = availableOptions.find(o => o.isDefault) || availableOptions[0];
  }

  const shippingFee = selectedOption.cost;
  // Tax: 15% VAT applies only to Saudi Arabia, 0% for Yemen and international export
  const tax = isSaudi ? Math.round(subtotal * 0.15) : 0;
  const grandTotal = parseFloat((subtotal + tax + shippingFee).toFixed(2));

  return {
    isYemen,
    isSaudi,
    destinationCountry,
    detectedCity,
    selectedOption,
    availableOptions,
    shippingFee,
    tax,
    grandTotal,
  };
}

export async function seedShippingCarriers() {
  const existing = await db.select().from(shipping_carriers).limit(1);
  if (existing.length > 0) return;

  await db.insert(shipping_carriers).values([
    { name: "AliExpress Standard Shipping", name_ar: "الشحن العادي علي إكسبرس", name_en: "AliExpress Standard Shipping", tracking_url_template: "https://global.cainiao.com/detail.htm?mailNoList={tracking}", is_active: true },
    { name: "AliExpress Premium Shipping", name_ar: "الشحن السريع علي إكسبرس", name_en: "AliExpress Premium Shipping", tracking_url_template: "https://global.cainiao.com/detail.htm?mailNoList={tracking}", is_active: true },
    { name: "AliExpress Economic Freight", name_ar: "شحن اقتصادي مجمّع علي إكسبرس", name_en: "AliExpress Economic Freight", tracking_url_template: "https://global.cainiao.com/detail.htm?mailNoList={tracking}", is_active: true },
    { name: "Amazon Logistics", name_ar: "شحن أمازون", name_en: "Amazon Logistics", tracking_url_template: "https://track.amazon.com/tracking/{tracking}", is_active: true },
    { name: "DHL Express", name_ar: "دي إتش إل إكسبريس", name_en: "DHL Express", tracking_url_template: "https://www.dhl.com/en/express/tracking.html?AWB={tracking}", is_active: true },
    { name: "Aramex", name_ar: "أرامكس", name_en: "Aramex", tracking_url_template: "https://www.aramex.com/track?ShipmentNumber={tracking}", is_active: true },
    { name: "SMSA Express", name_ar: "سمسا", name_en: "SMSA Express", tracking_url_template: "https://www.smsaexpress.com/tracking", is_active: true },
  ]);
  logger.info("Shipping carriers seeded");
}

export async function createShipment(
  orderId: number,
  carrierId: number,
  trackingNumber: string,
  cost: number,
  currency: string = "SAR",
): Promise<any> {
  const [shipment] = await db.insert(shipments).values({
    order_id: orderId,
    carrier_id: carrierId,
    tracking_number: trackingNumber,
    status: "pending",
    cost,
    currency,
  }).returning();
  return shipment;
}

export async function getOrderShipments(orderId: number): Promise<any[]> {
  return db.select().from(shipments).where(eq(shipments.order_id, orderId));
}

export async function updateShipmentStatus(
  shipmentId: number,
  status: string,
  trackingNumber?: string,
): Promise<void> {
  const update: any = { status, updated_at: new Date() };
  if (trackingNumber) update.tracking_number = trackingNumber;
  if (status === "delivered") update.actual_delivery = new Date();
  await db.update(shipments).set(update).where(eq(shipments.id, shipmentId));
}
