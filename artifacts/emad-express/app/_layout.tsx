import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { AddressProvider } from "@/context/AddressContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60000 } },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="checkout" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="addresses" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="favorites" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="returns" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="privacy" options={{ headerShown: false, presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <CurrencyProvider>
              <AuthProvider>
                <AddressProvider>
                  <FavoritesProvider>
                    <CartProvider>
                      <GestureHandlerRootView>
                        <KeyboardProvider>
                          <RootLayoutNav />
                        </KeyboardProvider>
                      </GestureHandlerRootView>
                    </CartProvider>
                  </FavoritesProvider>
                </AddressProvider>
              </AuthProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
