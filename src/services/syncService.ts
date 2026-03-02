import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:3001'; // Update with actual IP for device testing

export interface CloudBackup {
  encryptedBlob: string;
  updatedAt: string;
}

export class SyncService {
  private static AUTH_TOKEN_KEY = 'so1ana_cloud_auth_token';

  /**
   * Derive an AES-256 key from a wallet signature
   */
  public static deriveKey(signature: string): string {
    return CryptoJS.SHA256(signature).toString();
  }

  /**
   * Encrypt data using AES-256
   */
  public static encrypt(data: any, key: string): string {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, key).toString();
  }

  /**
   * Decrypt data using AES-256
   */
  public static decrypt(encryptedData: string, key: string): any | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Login to backend and store token
   */
  public static async login(wallet: string, signature: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature, message }),
      });

      if (!response.ok) return false;

      const { token } = await response.json();
      await SecureStore.setItemAsync(this.AUTH_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Cloud login failed:', error);
      return false;
    }
  }

  /**
   * Upload encrypted blob to cloud
   */
  public static async uploadBackup(encryptedBlob: string): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ encryptedBlob }),
      });

      return response.ok;
    } catch (error) {
      console.error('Upload failed:', error);
      return false;
    }
  }

  /**
   * Download encrypted blob from cloud
   */
  public static async downloadBackup(): Promise<CloudBackup | null> {
    try {
      const token = await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/sync/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    }
  }

  /**
   * Delete cloud backup
   */
  public static async deleteBackup(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/sync/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }
}
