import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

export interface AppSettings {
  store_name: string;
  whatsapp_number: string;
  support_whatsapp: string;
  support_phone: string;
  support_email: string;
  facebook_url: string;
  twitter_url: string;
  address_ar: string;
  address_en: string;
  about_ar: string;
  about_en: string;
  app_version: string;
  default_currency: string;
  google_ads_enabled: boolean;
  admob_app_id_android?: string;
  admob_banner_unit_id?: string;
  admob_interstitial_unit_id?: string;
}

const DEFAULTS: AppSettings = {
  store_name: "عماد إكسبرس",
  whatsapp_number: "772223645",
  support_whatsapp: "772223645",
  support_phone: "772223645",
  support_email: "support@emadexpress.com",
  facebook_url: "https://www.facebook.com",
  twitter_url: "https://twitter.com",
  address_ar: "اليمن، تعز، شارع جمال",
  address_en: "Yemen, Taiz, Jamal Street",
  about_ar: "منصة تسوق إلكتروني متخصصة في توفير أحدث الأجهزة الإلكترونية والهواتف الذكية بأفضل الأسعار.",
  about_en: "An e-commerce platform specializing in the latest electronic devices at the best prices.",
  app_version: "18.0.1",
  default_currency: "SAR",
  google_ads_enabled: true,
};

let memorySettings: AppSettings = DEFAULTS;

// Hydrate from local cache on app launch
AsyncStorage.getItem("app_settings_cache")
  .then((stored) => {
    if (stored) {
      try {
        memorySettings = { ...DEFAULTS, ...JSON.parse(stored) };
      } catch {}
    }
  })
  .catch(() => {});

export function useAppSettings(_refreshTrigger?: boolean | number): AppSettings {
  const [localSettings, setLocalSettings] = useState<AppSettings>(memorySettings);

  const { data } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const res = await api.get("/app-settings");
      return res?.data || res;
    },
    staleTime: 10000,
    refetchInterval: 30000, // Automatically poll for setting changes every 30 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      const merged: AppSettings = { ...DEFAULTS, ...data };
      memorySettings = merged;
      setLocalSettings(merged);
      AsyncStorage.setItem("app_settings_cache", JSON.stringify(merged)).catch(() => {});
    }
  }, [data]);

  return localSettings;
}
