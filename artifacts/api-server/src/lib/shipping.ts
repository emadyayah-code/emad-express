import { db, shipping_carriers, shipments, orders } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedShippingCarriers() {
  const existing = await db.select().from(shipping_carriers).limit(1);
  if (existing.length > 0) return;

  await db.insert(shipping_carriers).values([
    { name: "AliExpress Standard Shipping", name_ar: "الشحن العادي علي إكسبرس", name_en: "AliExpress Standard Shipping", tracking_url_template: "https://global.cainiao.com/detail.htm?mailNoList={tracking}", is_active: true },
    { name: "AliExpress Premium Shipping", name_ar: "الشحن السريع علي إكسبرس", name_en: "AliExpress Premium Shipping", tracking_url_template: "https://global.cainiao.com/detail.htm?mailNoList={tracking}", is_active: true },
    { name: "Amazon Logistics", name_ar: "شحن أمازون", name_en: "Amazon Logistics", tracking_url_template: "https://track.amazon.com/tracking/{tracking}", is_active: true },
    { name: "DHL Express", name_ar: "دي إتش إل", name_en: "DHL Express", tracking_url_template: "https://www.dhl.com/en/express/tracking.html?AWB={tracking}", is_active: true },
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
