import { IdentityData, useAppStore, VerificationLevel } from '../store/useAppStore';

export const identityService = {
  async fetchIdentityData(publicKey: string): Promise<IdentityData> {
    return new Promise(async (resolve) => {
      // 600ms simulation delay
      await new Promise(r => setTimeout(r, 600));

      // Deterministic generation based on pubkey length or chars
      const seed = publicKey.length;
      const riskScore = Math.floor(Math.random() * 30) + (seed % 10);
      
      const levels: VerificationLevel[] = ['basic', 'verified', 'institutional'];
      const level = levels[seed % 3];

      const mockData: IdentityData = {
        verificationLevel: level,
        riskScore,
        permissions: ['Auth.Sign', 'Vault.Read', 'Identity.Verify'],
        lastActivity: new Date().toISOString(),
        activeSessions: (seed % 4) + 1
      };

      useAppStore.getState().setIdentityData(mockData);
      resolve(mockData);
    });
  }
};
