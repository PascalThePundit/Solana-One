import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider as WebWalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export const getWallets = () => [
  new PhantomWalletAdapter(),
];

export const WalletModalProvider = WebWalletModalProvider;
