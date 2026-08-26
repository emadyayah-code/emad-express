import { useEffect, useState } from "react";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "emadexpress.ayadicmed.com";
const BASE = `https://${DOMAIN}/api`;

export interface AppSettings {
  whatsapp_number: string;
  facebook_url: string;
  twitter_url: string;
  address_ar: string;
  address_en: string;
  about_ar: string;
  about_en: string;
  app_version: string;
}

const DEFAULTS: AppSettings = {
  whatsapp_number: "772223645",
  facebook_url: "https://www.facebook.com",
  twitter_url: "https://twitter.com",
  address_ar: "اليمن، تعز، شارع جمال",
  address_en: "Yemen, Taiz, Jamal Street",
  about_ar: "منصة تسوق إلكتروني متخصصة في توفير أحدث الأجهزة الإلكترونية بأفضل الأسعار.",
  about_en: "An e-commerce platform specializing in the latest electronic devices at the best prices.",
  app_version: "2.0.0",
};

let cached: AppSettings | null = null;

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) { setSettings(cached); return; }
    fetch(`${BASE}/app-settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const s: AppSettings = { ...DEFAULTS, ...data };
          cached = s;
          setSettings(s);
        }
      })
      .catch(() => {});
  }, []);

  return settings;
}
