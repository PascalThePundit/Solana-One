import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  intensity = 60,
  borderRadius = 32,
}) => {
  const shimmer = useSharedValue(-1);
  const parallaxY = useSharedValue(20);
  const breath = useSharedValue(0);

  useEffect(() => {
    parallaxY.value = withTiming(0, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    breath.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    const triggerShimmer = () => {
      // FIX 3: Cancel any in-flight shimmer animation before resetting
      cancelAnimation(shimmer);
      shimmer.value = -1;
      shimmer.value = withDelay(
        500,
        withTiming(1, {
          duration: 2000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      );
    };

    triggerShimmer();

    const interval = setInterval(triggerShimmer, 6000);
    return () => clearInterval(interval);
  // FIX 4: Include shared values in the dependency array
  }, [shimmer, parallaxY, breath]);

  // FIX 1: Shadow styles moved to a separate outer wrapper (no overflow: "hidden")
  // so iOS shadows are not clipped.
  const animatedShadowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: parallaxY.value }],
    shadowOpacity: interpolate(breath.value, [0, 1], [0.3, 0.6]),
    shadowRadius: interpolate(breath.value, [0, 1], [20, 35]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmer.value, [-1, 1], [-width, width * 1.5]),
      },
      { skewX: "-25deg" },
    ],
    opacity: interpolate(
      shimmer.value,
      [-0.2, 0.5, 1],
      [0, 0.18, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.1, 0.3]),
  }));

  return (
    // FIX 1: Outer wrapper handles shadow only — no overflow: "hidden" here
    <Animated.View
      style={[
        styles.shadowWrapper,
        { borderRadius },
        style,
        animatedShadowStyle,
      ]}
    >
      {/* FIX 1: Inner wrapper handles clipping — shadows are unaffected */}
      <View style={[styles.clipWrapper, { borderRadius }]}>
        {/* 1. Base Layer */}
        <LinearGradient
          colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />

        {/* 2. Blur Layer */}
        <BlurView
          intensity={intensity}
          tint="default"
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />

        {/* 3. Texture Overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, backgroundColor: "rgba(255,255,255,0.03)" },
          ]}
        />

        {/* 4. Lighting Highlight — FIX 2: wrap in View with pointerEvents */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "transparent", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
        </View>

        {/* 5. Shimmer Layer */}
        <View
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.3)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* 6. Animated Border */}
        <Animated.View
          style={[styles.border, { borderRadius }, borderStyle]}
          pointerEvents="none"
        />

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // FIX 1: Shadow wrapper — no overflow so iOS shadows render correctly
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    backgroundColor: "transparent",
  },
  // FIX 1: Clip wrapper — overflow: "hidden" lives here, away from shadows
  clipWrapper: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderTopColor: "rgba(255,255,255,0.5)",
    borderLeftColor: "rgba(255,255,255,0.4)",
    zIndex: 10,
  },
  content: {
    zIndex: 20,
  },
});