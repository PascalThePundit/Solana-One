import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';
import { FadeInView } from '../../src/animations/FadeInView';
import { SeekerButton } from '../../src/components/SeekerButton';

export default function IdentityStatementScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FadeInView delay={400}>
          <Text style={styles.label}>CONCEPT</Text>
        </FadeInView>
        <FadeInView delay={800}>
          <Text style={styles.headline}>This is your Identity Layer.</Text>
        </FadeInView>
        <FadeInView delay={1200}>
          <Text style={styles.description}>
            A permanent, sovereign, and intelligent extension of yourself on the blockchain.
          </Text>
        </FadeInView>
      </View>

      <View style={styles.footer}>
        <FadeInView delay={1600}>
          <SeekerButton 
            title="Next Step" 
            onPress={() => router.push('/(onboarding)/wallet')} 
          />
        </FadeInView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: Theme.spacing.xl 
  },
  label: {
    color: Theme.colors.primary,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '600',
    marginBottom: Theme.spacing.md,
  },
  headline: {
    color: Theme.colors.text.high,
    fontSize: 40,
    fontWeight: '300',
    lineHeight: 52,
  },
  description: {
    color: Theme.colors.text.medium,
    fontSize: 18,
    lineHeight: 30,
    marginTop: Theme.spacing.lg,
    fontWeight: '300',
  },
  footer: {
    padding: Theme.spacing.xl,
    paddingBottom: 60,
  }
});
