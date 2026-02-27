import { Stack } from 'expo-router';
import { Theme } from '../../src/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="identity" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="biometric" />
    </Stack>
  );
}
