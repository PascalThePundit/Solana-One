import "./../shims";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreenNative from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles that can be overridden by your app
if (Platform.OS === "web") {
  require("@solana/wallet-adapter-react-ui/styles.css");
}

import { BiometricModal } from "../src/components/BiometricModal";
import { LockScreen } from "../src/components/LockScreen";
import { WalletConnectionHandler } from "../src/components/WalletConnectionHandler";
import { sessionManager } from "../src/security/sessionManager";
import { useIdentityStore } from "../src/store/identityStore";
import { useAppStore } from "../src/store/useAppStore";
import CustomSplashScreen from "./SplashScreen";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

import { initializeSkia } from "../src/services/skia-loader";

// Keep the splash screen visible while we fetch resources
SplashScreenNative.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause some errors */
});

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const { isLocked, lastInteraction, updateInteraction, isAuthenticated } =
    useIdentityStore();
  const appState = useRef(AppState.currentState);

  // 1. Session Restoration and App Initialization
  useEffect(() => {
    async function prepare() {
      try {
        // Handle Skia Initialization (platform-agnostic)
        await initializeSkia();

        const hasSession = await sessionManager.loadSession();
        if (hasSession) {
          sessionManager.authenticateBiometrics();
        }
      } catch (e) {
        console.warn("Initialization error:", e);
      } finally {
        setAppIsReady(true);
        // Hide the native splash screen as soon as the JS is ready
        await SplashScreenNative.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  // 2. AppState Listener for Auto-Lock
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // App went to background
          if (isAuthenticated) {
            sessionManager.lockApp();
          }
        }

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground
          if (isAuthenticated && isLocked) {
            sessionManager.authenticateBiometrics();
          }
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLocked]);

  // 3. Inactivity Timeout
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isLocked) {
        const now = Date.now();
        if (now - lastInteraction > INACTIVITY_TIMEOUT) {
          sessionManager.lockApp();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, isLocked, lastInteraction]);

  // Trigger unlock when isLocked becomes true (e.g. from timeout or background)
  useEffect(() => {
    if (isAuthenticated && isLocked) {
      sessionManager.authenticateBiometrics();
    }
  }, [isLocked, isAuthenticated]);

  const handleInteraction = () => {
    updateInteraction();
  };

  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    [],
  );

  if (!appIsReady) {
    return null;
  }

  if (showCustomSplash) {
    return (
      <CustomSplashScreen
        onAnimationComplete={() => setShowCustomSplash(false)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <WalletConnectionHandler />
              <View style={{ flex: 1 }} onTouchStart={handleInteraction}>
                <ThemeProvider value={DarkTheme}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: "fade",
                      animationDuration: 400,
                    }}
                  >
                    {!isOnboarded ? (
                      <Stack.Screen name="(onboarding)" />
                    ) : (
                      <Stack.Screen name="(tabs)" />
                    )}
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal", title: "Modal" }}
                    />
                    <Stack.Screen
                      name="approve-transaction"
                      options={{
                        presentation: "transparentModal",
                        animation: "slide_from_bottom",
                        headerShown: false,
                      }}
                    />
                  </Stack>
                  <StatusBar style="light" />
                  <BiometricModal />
                  <LockScreen />
                </ThemeProvider>
              </View>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
