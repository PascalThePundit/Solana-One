import { Easing } from 'react-native-reanimated';

export const Motion = {
  // Cinematic easing curves
  easing: {
    standard: Easing.bezier(0.25, 0.1, 0.25, 1),
    decelerate: Easing.bezier(0.4, 0.0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),
    natural: Easing.out(Easing.poly(3)), // Soft natural decay
    elastic: Easing.elastic(0.8), // Reduced bounce for premium feel
  },
  
  // Standardized durations (ms)
  duration: {
    micro: 150,     // Hover, press
    short: 300,     // Toggle, fade
    medium: 500,    // Screen enter/exit
    long: 800,      // Complex transitions
    cinema: 1200,   // Intro, splash sequences
    breathing: 4000, // Slow ambient pulses
  },

  // Delays for staggered entrances
  delay: {
    base: 100,
    step: 80,
  },
  
  // Spring configurations for tactile feel
  spring: {
    tactile: {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    },
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    }
  }
};
