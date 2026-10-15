import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

export type CurrencyCode = "SAR" | "YER" | "USD";

export interface Currency {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  symbol: string;
  rate: number; // rate vs SAR (base)
  decimals: number;
}

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", symbol: "ر.س", rate: 1, decimals: 0 },
  { code: "YER", nameAr: "ريال يمني", nameEn: "Yemeni Rial", symbol: "ر.ي", rate: 530, decimals: 0 },
  { code: "USD", nameAr: "دولار", nameEn: "US Dollar", symbol: "$", rate: 0.2667, decimals: 2 },
];

export const CURRENCIES = DEFAULT_CURRENCIES;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  format: (sarAmount: number, lang?: string) => string;
  formatPrice: (sarAmount: number, lang?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCIES[0],
  setCurrency: () => {},
  format: (n, lang = "ar") => (lang === "ar" ? `${n.toLocaleString()} ر.س` : `SAR ${n.toLocaleString()}`),
  formatPrice: (n, lang = "ar") => (lang === "ar" ? `${n.toLocaleString()} ر.س` : `SAR ${n.toLocaleString()}`),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("SAR");
  const [currencyList, setCurrencyList] = useState<Currency[]>(DEFAULT_CURRENCIES);

  useEffect(() => {
    AsyncStorage.getItem("app_currency").then((v) => {
      if (v === "SAR" || v === "YER" || v === "USD") setCode(v as CurrencyCode);
    });

    const syncCurrencies = async () => {
      try {
        const res = await api.get("/currencies");
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          const sarObj = list.find((c: any) => c.code === "SAR");
          const sarToUsd = Number(sarObj?.rate_to_usd) || 3.75;
          const updated = DEFAULT_CURRENCIES.map((c) => {
            const remote = list.find((r: any) => r.code === c.code);
            if (remote && remote.rate_to_usd) {
              const newRate = remote.code === "SAR" ? 1 : Number(remote.rate_to_usd) / sarToUsd;
              return { ...c, rate: Number(newRate.toFixed(4)) };
            }
            return c;
          });
          setCurrencyList(updated);
        }
      } catch {}
    };

    syncCurrencies();
    const interval = setInterval(syncCurrencies, 60000); // Auto-sync currency rates from admin panel every 60s
    return () => clearInterval(interval);
  }, []);

  const currency = currencyList.find(c => c.code === code) ?? currencyList[0];

  function setCurrency(c: CurrencyCode) {
    setCode(c);
    AsyncStorage.setItem("app_currency", c);
  }

  function format(sarAmount: number, lang: string = "ar"): string {
    const converted = sarAmount * currency.rate;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
    const symbol = lang === "ar" 
      ? currency.symbol 
      : (currency.code === "USD" ? "$" : currency.code);
    return lang === "ar" ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, formatPrice: format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
