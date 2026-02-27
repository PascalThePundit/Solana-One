import { Platform } from 'react-native';
import { Motion } from './motion';

export const Theme = {
  colors: {
    background: '#000000', // Solid black base for 2026 aesthetics
    surface: 'rgba(30, 30, 40, 0.7)', // Liquid Glass Dark Base
    primary: '#FFFFFF',    // White primary for clean 2026 feel
    accent: '#007AFF',     // iOS-style accent
    text: {
      high: '#FFFFFF',
      medium: '#AAAAAA',
      low: 'rgba(255, 255, 255, 0.4)',
    },
    liquidGlass: {
      dark: {
        background: 'rgba(30, 30, 40, 0.7)',
        border: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
        highlight: 'rgba(255,255,255,0.2)',
      },
      light: {
        background: 'rgba(235, 245, 255, 0.7)',
        border: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)'],
        highlight: 'rgba(255,255,255,0.5)',
      }
    }
  },
  fonts: {
    family: Platform.select({
      ios: 'SF Pro Display',
      android: 'Inter',
      default: 'system-ui, -apple-system, sans-serif',
    }),
    weight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
    },
    size: {
      h1: 34,
      h2: 24,
      body: 17,
      caption: 14,
    }
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  animation: Motion,
};
