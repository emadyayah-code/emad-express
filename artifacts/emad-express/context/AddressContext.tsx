import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Address {
  id: string;
  title: string;
  recipientName: string;
  phone: string;
  dialCode?: string;
  country: string;
  countryCode?: string;
  countryFlag?: string;
  street: string;
  apartment?: string;
  state?: string;
  city: string;
  zipCode?: string;
  isDefault: boolean;
}

interface AddressCtx {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (addr: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, addr: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressCtx>({} as AddressCtx);
export const useAddress = () => useContext(AddressContext);

const STORAGE_KEY = "emad_user_addresses";

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const list: Address[] = JSON.parse(data);
          setAddresses(list);
        } catch {}
      }
    });
  }, []);

  async function saveAddresses(list: Address[]) {
    setAddresses(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  async function addAddress(addr: Omit<Address, "id">) {
    const isFirst = addresses.length === 0;
    const newAddress: Address = {
      ...addr,
      id: Date.now().toString(),
      isDefault: isFirst || addr.isDefault,
    };
    let updated = isFirst || addr.isDefault
      ? addresses.map(a => ({ ...a, isDefault: false }))
      : [...addresses];
    updated = [newAddress, ...updated];
    await saveAddresses(updated);
  }

  async function updateAddress(id: string, addr: Partial<Address>) {
    let updated = addresses.map(a => {
      if (a.id === id) {
        return { ...a, ...addr };
      }
      if (addr.isDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });
    await saveAddresses(updated);
  }

  async function deleteAddress(id: string) {
    const remaining = addresses.filter(a => a.id !== id);
    if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
      remaining[0].isDefault = true;
    }
    await saveAddresses(remaining);
  }

  async function setDefaultAddress(id: string) {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    }));
    await saveAddresses(updated);
  }

  const defaultAddress = addresses.find(a => a.isDefault) || (addresses.length > 0 ? addresses[0] : null);

  return (
    <AddressContext.Provider value={{ addresses, defaultAddress, addAddress, updateAddress, deleteAddress, setDefaultAddress }}>
      {children}
    </AddressContext.Provider>
  );
}
