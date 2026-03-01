import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export const generateVerificationMessage = (address: string) => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  return `Sign this message to verify ownership of your Seeker Hub account:
Wallet: ${address}
Timestamp: ${timestamp}
Nonce: ${nonce}`;
};

export const verifyWalletSignature = (
  message: string,
  signature: Uint8Array,
  publicKeyStr: string,
): boolean => {
  try {
    const publicKey = new PublicKey(publicKeyStr);
    const messageBytes = Buffer.from(message, "utf8");
    return nacl.sign.detached.verify(
      messageBytes,
      signature,
      publicKey.toBytes(),
    );
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};
