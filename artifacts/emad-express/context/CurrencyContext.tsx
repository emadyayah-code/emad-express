import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CurrencyCode = "SAR" | "YER" | "USD";

export interface Currency {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  symbol: string;
  rate: number; // rate vs SAR (base)
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal",   symbol: "ر.س",  rate: 1,       decimals: 0 },
  { code: "YER", nameAr: "ريال يمني",  nameEn: "Yemeni Rial",   symbol: "ر.ي",  rate: 530,     decimals: 0 },
  { code: "USD", nameAr: "دولار",       nameEn: "US Dollar",     symbol: "$",    rate: 0.2667,  decimals: 2 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  format: (sarAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
  format: (n) => `${n.toLocaleString()} ر.س`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>("SAR");

  useEffect(() => {
    AsyncStorage.getItem("app_currency").then((v) => {
      if (v === "SAR" || v === "YER" || v === "USD") setCode(v);
    });
  }, []);

  const currency = CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];

  function setCurrency(c: CurrencyCode) {
    setCode(c);
    AsyncStorage.setItem("app_currency", c);
  }

  function format(sarAmount: number): string {
    const converted = sarAmount * currency.rate;
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
    return `${formatted} ${currency.symbol}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
