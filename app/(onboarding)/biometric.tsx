import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FadeInView } from "../../src/animations/FadeInView";
import { SeekerButton } from "../../src/components/SeekerButton";
import { sessionManager } from "../../src/security/sessionManager";
import { useAppStore } from "../../src/store/useAppStore";
import { Theme } from "../../src/theme";

export default function BiometricScreen() {
  const [status, setStatus] = useState<"idle" | "verifying" | "success">(
    "idle",
  );
  const { completeOnboarding, setWalletConnected } = useAppStore();

  const handleVerify = () => {
    setStatus("verifying");
    setTimeout(async () => {
      setStatus("success");
      setWalletConnected(true);
      await sessionManager.login();
      setTimeout(() => {
        completeOnboarding();
        // Router will auto-redirect based on layout state
      }, 1500);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FadeInView delay={400}>
          <Text style={styles.headline}>Secure with FaceID.</Text>
        </FadeInView>
        <FadeInView delay={800}>
          <Text style={styles.description}>
            Your biometric data stays encrypted on the Seeker Secure Element.
          </Text>
        </FadeInView>

        <View style={styles.biometricContainer}>
          <FadeInView delay={1200} direction="none">
            <View
              style={[
                styles.iconCircle,
                status === "success" && { borderColor: Theme.colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === "success" && { color: Theme.colors.accent },
                ]}
              >
                {status === "idle" && "TAP TO SCAN"}
                {status === "verifying" && "VERIFYING..."}
                {status === "success" && "SECURED"}
              </Text>
            </View>
          </FadeInView>
        </View>
      </View>

      <View style={styles.footer}>
        <FadeInView delay={1600}>
          <SeekerButton
            title={status === "success" ? "Welcome Home" : "Enable Biometrics"}
            onPress={handleVerify}
          />
        </FadeInView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.xl,
  },
  headline: {
    color: Theme.colors.text.high,
    fontSize: 32,
    fontWeight: "300",
  },
  description: {
    color: Theme.colors.text.medium,
    fontSize: 16,
    lineHeight: 24,
    marginTop: Theme.spacing.md,
    fontWeight: "300",
  },
  biometricContainer: {
    marginTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
  },
  statusText: {
    color: Theme.colors.text.low,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "600",
  },
  footer: {
    padding: Theme.spacing.xl,
    paddingBottom: 60,
  },
});
