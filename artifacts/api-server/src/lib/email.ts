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

function renderOtpDigits(code: string): string {
  const digits = code.split("");
  return digits
    .map(
      (d) =>
        `<span style="display: inline-block; width: 42px; height: 52px; line-height: 52px; margin: 0 4px; background: #1a160c; border: 2px solid #f59e0b; border-radius: 12px; font-size: 28px; font-weight: 800; color: #fbbf24; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; text-align: center; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);">${d}</span>`
    )
    .join("");
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
      from: `"emadexpress" <${fromAddress}>`,
      to,
      subject: `رمز التحقق الخاص بك: ${code} 🔐 - emadexpress`,
      html: `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 0; background-color: #06080d; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #f3f4f6; }
          </style>
        </head>
        <body style="margin: 0; padding: 30px 10px; background-color: #06080d;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0f131c; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            <!-- Header -->
            <tr>
              <td style="padding: 32px 24px 20px; text-align: center; background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 19, 28, 0) 100%);">
                <div style="display: inline-block; padding: 8px 18px; border-radius: 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; font-weight: 800; font-size: 14px; letter-spacing: 1px; margin-bottom: 12px;">
                  عماد إكسبرس • EMAD EXPRESS
                </div>
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">تأكيد البريد الإلكتروني</h1>
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">بوابتك للتسوق الإلكتروني الأسرع والأكثر أماناً</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 10px 28px 28px; text-align: center;">
                <p style="color: #e5e7eb; font-size: 15px; line-height: 1.7; margin: 0 0 22px;">
                  مرحباً <strong>${name}</strong> 👋<br>
                  شكراً لانضمامك إلى عماد إكسبرس. يرجى استخدام رمز التحقق التالي لإكمال تفعيل حسابك:
                </p>

                <!-- Digits Box -->
                <div style="padding: 24px 12px; margin: 20px 0; background: #07090e; border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 18px;">
                  <div style="margin-bottom: 12px;">
                    ${renderOtpDigits(code)}
                  </div>
                  <div style="color: #fbbf24; font-size: 12px; font-weight: 700; margin-top: 10px;">
                    ⏱️ الرمز صالح لمدة 15 دقيقة فقط
                  </div>
                </div>

                <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 18px 0 0;">
                  إذا لم تطلب هذا الرمز، يُرجى تجاهل هذه الرسالة أو التواصل معنا فوراً للحفاظ على أمان حسابك.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 18px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); background: #0b0e15;">
                <p style="color: #6b7280; font-size: 11px; margin: 0;">
                  © 2026 عماد إكسبرس. جميع الحقوق محفوظة.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `مرحباً ${name}،\n\nرمز التحقق الخاص بك في عماد إكسبرس هو: ${code}\nصالح لمدة 15 دقيقة.\n\nعماد إكسبرس`,
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
  const active = await getActiveEmailConfig();
  const mailer = active?.transporter;
  if (!mailer) {
    logger.warn({ to }, "Cannot send password reset email - SMTP not configured");
    return false;
  }

  const from = active?.from || process.env.SMTP_FROM || process.env.SMTP_USER || "support@emadexpress.com";

  try {
    await mailer.sendMail({
      from: `"emadexpress" <${from}>`,
      to,
      subject: `رمز إعادة تعيين كلمة المرور: ${code} 🔐 - emadexpress`,
      html: `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 0; background-color: #06080d; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #f3f4f6; }
          </style>
        </head>
        <body style="margin: 0; padding: 30px 10px; background-color: #06080d;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0f131c; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            <!-- Header -->
            <tr>
              <td style="padding: 32px 24px 20px; text-align: center; background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 19, 28, 0) 100%);">
                <div style="display: inline-block; padding: 8px 18px; border-radius: 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; font-weight: 800; font-size: 14px; letter-spacing: 1px; margin-bottom: 12px;">
                  عماد إكسبرس • EMAD EXPRESS
                </div>
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">إعادة تعيين كلمة المرور</h1>
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">طلب استعادة الحساب وتعيين كلمة مرور جديدة</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 10px 28px 28px; text-align: center;">
                <p style="color: #e5e7eb; font-size: 15px; line-height: 1.7; margin: 0 0 22px;">
                  مرحباً <strong>${name}</strong> 👋<br>
                  تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم رمز التحقق التالي للمتابعة:
                </p>

                <!-- Digits Box -->
                <div style="padding: 24px 12px; margin: 20px 0; background: #07090e; border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 18px;">
                  <div style="margin-bottom: 12px;">
                    ${renderOtpDigits(code)}
                  </div>
                  <div style="color: #fbbf24; font-size: 12px; font-weight: 700; margin-top: 10px;">
                    ⏱️ الرمز صالح لمدة 15 دقيقة فقط
                  </div>
                </div>

                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px; margin-top: 16px;">
                  <p style="color: #f87171; font-size: 12px; line-height: 1.5; margin: 0;">
                    🔒 تنبيه أمني: لا تشارك هذا الرمز مع أي شخص، حتى موظفي خدمة العملاء.
                  </p>
                </div>

                <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 18px 0 0;">
                  إذا لم تطلب استعادة كلمة المرور، يُرجى تجاهل هذه الرسالة وستبقى كلمة مرورك الحالية آمنة.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 18px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); background: #0b0e15;">
                <p style="color: #6b7280; font-size: 11px; margin: 0;">
                  © 2026 عماد إكسبرس. جميع الحقوق محفوظة.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `مرحباً ${name}،\n\nرمز إعادة تعيين كلمة المرور الخاص بك في عماد إكسبرس هو: ${code}\nصالح لمدة 15 دقيقة.\n\nعماد إكسبرس`,
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
