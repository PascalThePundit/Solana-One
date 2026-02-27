import { useAppStore } from '../store/useAppStore';

export const biometricService = {
  async authenticateUser(level: 'low' | 'medium' | 'high' = 'low'): Promise<boolean> {
    const { setBiometricStatus, setBiometricActive } = useAppStore.getState();

    return new Promise(async (resolve) => {
      setBiometricActive(true);
      setBiometricStatus('scanning');

      // 1.5s simulation delay
      await new Promise(r => setTimeout(r, 1500));

      // 95% success rate simulation
      const success = Math.random() < 0.95;

      if (success) {
        setBiometricStatus('success');
        // Delay to show success animation before closing
        await new Promise(r => setTimeout(r, 800));
        setBiometricActive(false);
        setBiometricStatus('idle');
        resolve(true);
      } else {
        setBiometricStatus('failure');
        // Delay for fallback
        await new Promise(r => setTimeout(r, 1200));
        setBiometricActive(false);
        setBiometricStatus('idle');
        resolve(false);
      }
    });
  }
};
