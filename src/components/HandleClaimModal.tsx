import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../theme';
import { GlassCard } from './ui/GlassCard';
import { SeekerButton } from './SeekerButton';
import { registerHandle, validateHandle } from '../identity/handleRegistry';
import { useIdentityStore } from '../store/identityStore';
import * as Haptics from 'expo-haptics';

interface HandleClaimModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HandleClaimModal: React.FC<HandleClaimModalProps> = ({ visible, onClose }) => {
  const [handleInput, setHandleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const identity = useIdentityStore();
  const activeWallet = identity.getActiveWallet();

  const handleClaim = async () => {
    if (!activeWallet) return;
    
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const fullHandle = handleInput.toLowerCase().endsWith('.sol') 
      ? handleInput.toLowerCase() 
      : `${handleInput.toLowerCase()}.sol`;

    try {
      const result = await registerHandle(fullHandle, activeWallet.address);
      if (result.success) {
        identity.setHandle(fullHandle);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setError(result.error || 'Failed to claim handle');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <GlassCard intensity={80} variant="liquid" style={styles.modalContent}>
          <Text style={styles.title}>Claim .sol Handle</Text>
          <Text style={styles.subtitle}>
            Register your unique identity on the Seeker network.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="yourname"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={handleInput}
              onChangeText={setHandleInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.suffix}>.sol</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <SeekerButton
              title={loading ? "" : "Claim Handle"}
              onPress={handleClaim}
              style={styles.claimBtn}
              disabled={loading || !handleInput}
            >
              {loading && <ActivityIndicator color="#fff" />}
            </SeekerButton>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: Theme.colors.text.medium,
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  suffix: {
    color: Theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: Theme.colors.text.low,
    fontSize: 14,
    fontWeight: '600',
  },
  claimBtn: {
    flex: 2,
    height: 56,
  },
});
