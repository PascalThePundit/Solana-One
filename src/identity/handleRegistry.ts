import * as SecureStore from 'expo-secure-store';

const HANDLE_KEY = 'seeker_identity_handle';

export interface HandleClaimResult {
  success: boolean;
  error?: string;
}

/**
 * Mock handle registry to simulate on-chain state.
 * In a real app, this would query a Solana PDA or Anchor program.
 */
const mockRegistry: Record<string, string> = {};

export const validateHandle = (handle: string): { isValid: boolean; error?: string } => {
  if (!handle.endsWith('.sol')) {
    return { isValid: false, error: 'Handle must end with .sol' };
  }

  const namePart = handle.slice(0, -4);
  
  if (namePart.length < 3) {
    return { isValid: false, error: 'Name must be at least 3 characters' };
  }

  if (namePart.length > 20) {
    return { isValid: false, error: 'Name must be at most 20 characters' };
  }

  const alphanumericRegex = /^[a-z0-9]+$/;
  if (!alphanumericRegex.test(namePart)) {
    return { isValid: false, error: 'Only lowercase letters and numbers allowed' };
  }

  return { isValid: true };
};

export const checkHandleAvailability = async (handle: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return !mockRegistry[handle.toLowerCase()];
};

export const registerHandle = async (handle: string, walletAddress: string): Promise<HandleClaimResult> => {
  const validation = validateHandle(handle);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const isAvailable = await checkHandleAvailability(handle);
  if (!isAvailable) {
    return { success: false, error: 'Handle already taken' };
  }

  // Persist locally
  await SecureStore.setItemAsync(HANDLE_KEY, handle);
  
  // Mock registry update
  mockRegistry[handle.toLowerCase()] = walletAddress;

  return { success: true };
};

export const resolveHandle = (handle: string): string | null => {
  return mockRegistry[handle.toLowerCase()] || null;
};

export const getStoredHandle = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(HANDLE_KEY);
};

export const clearStoredHandle = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(HANDLE_KEY);
};
