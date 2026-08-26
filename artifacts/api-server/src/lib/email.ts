import nodemailer from "nodemailer";
import { logger } from "./logger";

// Email configuration - reads from env or platform_settings
let transporter: nodemailer.Transporter | null = null;

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function createTransporter(config: EmailConfig): nodemailer.Transporter {
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

import { db, platform_settings } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getSmtpConfigFromDb(): Promise<EmailConfig | null> {
  try {
    const settings = await db.select().from(platform_settings);
    const cfg: Record<string, string> = {};
    settings.forEach(s => cfg[s.key] = s.value);

    const host = cfg["smtp_host"] || process.env.SMTP_HOST;
    const port = cfg["smtp_port"] ? parseInt(cfg["smtp_port"]) : (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587);
    const user = cfg["smtp_user"] || process.env.SMTP_USER;
    const pass = cfg["smtp_pass"] || process.env.SMTP_PASS;
    const from = cfg["smtp_from"] || process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!host || !user || !pass) return null;

    return { host, port, secure: port === 465, user, pass, from: from || user };
  } catch {
    return null;
  }
}

export function getDefaultTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  // Try to create from environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env or Admin Panel > Email Settings");
    return null;
  }

  transporter = createTransporter({
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from: from || user,
  });

  return transporter;
}

export async function getActiveEmailConfig(): Promise<{ transporter: nodemailer.Transporter; from: string } | null> {
  // 1. Try DB settings
  const dbConfig = await getSmtpConfigFromDb();
  if (dbConfig) {
    const t = createTransporter(dbConfig);
    return { transporter: t, from: dbConfig.from || dbConfig.user || "emadyayah@gmail.com" };
  }

  // 2. Try environment / default
  const envT = getDefaultTransporter();
  if (envT) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "emadyayah@gmail.com";
    return { transporter: envT, from };
  }

  return null;
}

export async function getTransporter(): Promise<nodemailer.Transporter | null> {
  const active = await getActiveEmailConfig();
  return active ? active.transporter : null;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string,
  customTransporter?: nodemailer.Transporter
): Promise<boolean> {
  const active = await getActiveEmailConfig();
  const mailer = customTransporter || active?.transporter;
  if (!mailer) {
    logger.warn({ to }, "Cannot send verification email - SMTP not configured");
    return false;
  }

  const fromAddress = active?.from || "emadyayah@gmail.com";

  try {
    await mailer.sendMail({
      from: `"عماد إكسبرس" <${fromAddress}>`,
      to,
      subject: "كود التحقق من البريد الإلكتروني 🔐",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #059669; margin: 0;">عماد إكسبرس</h1>
            <p style="color: #64748b; margin: 8px 0 0 0;">منصة التجارة الإلكترونية</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">مرحباً ${name} 👋</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
              شكراً لتسجيلك في عماد إكسبرس. لإكمال عملية التسجيل، يرجى إدخال كود التحقق التالي:
            </p>

            <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #059669; font-size: 12px; margin: 8px 0 0 0;">صالح لمدة 15 دقيقة</p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 16px 0 0 0;">
              إذا لم تقم بطلب هذا الكود، يمكنك تجاهل هذه الرسالة بأمان.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #94a3b8; font-size: 12px;">© عماد إكسبرس. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      `,
      text: `مرحباً ${name}،\n\nكود التحقق الخاص بك هو: ${code}\n\nصالح لمدة 15 دقيقة.\n\nعماد إكسبرس`,
    });

    logger.info({ to, from: fromAddress }, "Verification email sent successfully");
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, to }, "Failed to send verification email");
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  code: string
): Promise<boolean> {
  const mailer = await getTransporter();
  if (!mailer) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@emadexpress.com";

  try {
    await mailer.sendMail({
      from: `"عماد إكسبرس" <${from}>`,
      to,
      subject: "إعادة تعيين كلمة المرور 🔐",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
          <h2 style="color: #1e293b;">إعادة تعيين كلمة المرور</h2>
          <p>مرحباً ${name}،</p>
          <p>لقد طلبت إعادة تعيين كلمة المرور. استخدم الكود التالي:</p>
          <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px;">${code}</div>
          </div>
          <p style="color: #64748b; font-size: 13px;">صالح لمدة 15 دقيقة. إذا لم تطلب هذا، تجاهل الرسالة.</p>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, to }, "Failed to send password reset email");
    return false;
  }
}

export function generateVerificationCode(): string {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15); // 15 minutes
  return expiry;
}
