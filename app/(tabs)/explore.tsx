import { StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Colors } from '@/constants/theme';
import { useAppStore } from '@/src/store/useAppStore';
import { SyncService } from '@/src/services/syncService';

export default function ExploreScreen() {
  const { publicKey, signMessage } = useWallet();
  const { 
    isCloudSyncActive, 
    setCloudSync, 
    lastCloudSync, 
    setLastCloudSync,
    rehydrateStore,
    ...storeState 
  } = useAppStore();

  const [loading, setLoading] = useState(false);

  const getBackupKey = async () => {
    if (!signMessage || !publicKey) return null;
    const message = new TextEncoder().encode("So1ana Cloud Sync Encryption Key");
    const signature = await signMessage(message);
    return SyncService.deriveKey(bs58.encode(signature));
  };

  const handleToggleSync = async (value: boolean) => {
    if (!publicKey || !signMessage) {
      Alert.alert("Wallet Required", "Please connect your wallet to use Cloud Sync.");
      return;
    }

    if (value) {
      setLoading(true);
      try {
        const message = `Login to So1ana Hub Cloud Sync: ${new Date().toISOString()}`;
        const signature = await signMessage(new TextEncoder().encode(message));
        const success = await SyncService.login(
          publicKey.toBase58(),
          bs58.encode(signature),
          message
        );

        if (success) {
          setCloudSync(true);
          await handleUpload();
        } else {
          Alert.alert("Error", "Failed to authenticate with cloud server.");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else {
      setCloudSync(false);
    }
  };

  const handleUpload = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const key = await getBackupKey();
      if (!key) return;

      // Extract relevant state for backup
      const backupData = {
        identityData: storeState.identityData,
        isBiometricActive: storeState.isBiometricActive,
        activityHistory: storeState.activityHistory,
        notifications: storeState.notifications,
      };

      const encrypted = SyncService.encrypt(backupData, key);
      const success = await SyncService.uploadBackup(encrypted);
      
      if (success) {
        setLastCloudSync(new Date().toISOString());
      }
    } catch (e) {
      Alert.alert("Backup Failed", "Unable to secure your data in the cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const key = await getBackupKey();
      if (!key) return;

      const backup = await SyncService.downloadBackup();
      if (!backup) {
        Alert.alert("No Backup", "No existing cloud backup found for this wallet.");
        return;
      }

      const decrypted = SyncService.decrypt(backup.encryptedBlob, key);
      if (decrypted) {
        rehydrateStore(decrypted);
        setLastCloudSync(backup.updatedAt);
        Alert.alert("Success", "Application state restored successfully.");
      } else {
        Alert.alert("Error", "Failed to decrypt backup. Ensure you are using the correct wallet.");
      }
    } catch (e) {
      Alert.alert("Restore Failed", "Error connecting to cloud sync.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = () => {
    Alert.alert(
      "Delete Backup",
      "This will permanently remove your data from the cloud. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await SyncService.deleteBackup();
            if (success) {
              setLastCloudSync(null);
              setCloudSync(false);
              Alert.alert("Deleted", "Cloud backup removed.");
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="cloud.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>Settings</ThemedText>
      </ThemedView>

      <Collapsible title="Cloud Sync (Zero-Knowledge)" defaultOpen>
        <ThemedView style={styles.settingItem}>
          <ThemedView>
            <ThemedText type="defaultSemiBold">Enable Cloud Backup</ThemedText>
            <ThemedText style={styles.settingDesc}>AES-256 encrypted. We never see your data.</ThemedText>
          </ThemedView>
          <Switch
            value={isCloudSyncActive}
            onValueChange={handleToggleSync}
            trackColor={{ false: '#767577', true: Colors.dark.tint }}
          />
        </ThemedView>

        {isCloudSyncActive && (
          <ThemedView style={styles.syncStatus}>
            <ThemedText style={styles.statusText}>
              Last Sync: {lastCloudSync ? new Date(lastCloudSync).toLocaleString() : 'Never'}
            </ThemedText>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]} 
                onPress={handleUpload}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.buttonText}>Backup Now</ThemedText>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleRestore}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>Restore</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteBackup}
              disabled={loading}
            >
              <ThemedText style={styles.deleteButtonText}>Delete Cloud Backup</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </Collapsible>

      <Collapsible title="System Information">
        <ThemedText>Wallet: {publicKey ? publicKey.toBase58().slice(0, 8) + '...' : 'Disconnected'}</ThemedText>
        <ThemedText>Platform: {StyleSheet.flatten(styles.headerImage).position === 'absolute' ? 'Mobile' : 'Web'}</ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingDesc: {
    fontSize: 12,
    opacity: 0.6,
  },
  syncStatus: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
