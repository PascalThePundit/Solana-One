import { SolanaMobileWalletAdapter, createDefaultAddressSelector, createDefaultAuthorizationResultCache, createDefaultWalletNotFoundHandler } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import React from 'react';

export const getWallets = () => [
  new SolanaMobileWalletAdapter({
    addressSelector: createDefaultAddressSelector(),
    appIdentity: {
      name: "Seeker Identity Hub",
      uri: "https://seeker-hub.io",
      icon: "icon.png",
    },
    authorizationResultCache: createDefaultAuthorizationResultCache(),
    cluster: "devnet",
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
  }),
];

export const WalletModalProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
