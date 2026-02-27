import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { 
  Canvas, 
  Rect, 
  BackdropFilter, 
  Blur, 
  ColorMatrix, 
  LinearGradient, 
  vec,
  Fill, 
  Turbulence, 
  DisplacementMap,
  Shadow,
  RoundedRect,
  Group,
  Paint,
  RuntimeShader,
  Skia
} from '@shopify/react-native-skia';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolate,
  useDerivedValue,
  withRepeat,
  Easing
} from 'react-native-reanimated';

// Liquid Morph Shader (based on SDFs for that "merging/organic" look)
const liquidShader = Skia.RuntimeEffect.Make(`
  uniform float time;
  uniform float pressed;
  uniform vec2 size;
  uniform shader content;

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  vec4 main(vec2 pos) {
    vec2 center = size / 2.0;
    vec2 p = pos - center;
    
    // Create organic wobble
    float wobble = sin(p.x * 0.05 + time) * cos(p.y * 0.05 + time) * 3.0;
    
    float d = sdRoundedRect(p, (size / 2.0) - 10.0, 24.0);
    d += wobble * (1.0 - pressed * 0.5);
    
    float alpha = smoothstep(1.0, -1.0, d);
    vec4 color = content.eval(pos);
    return color * alpha;
  }
`)!;

interface LiquidGlassSurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  width: number;
  height: number;
  borderRadius?: number;
  mode?: 'light' | 'dark';
  pressed?: Animated.SharedValue<number>;
}

export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  children,
  style,
  width,
  height,
  borderRadius = 24,
  mode = 'dark',
  pressed
}) => {
  const time = useSharedValue(0);
  const internalPressed = useSharedValue(0);
  const activePressed = pressed || internalPressed;

  React.useEffect(() => {
    time.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const uniforms = useDerivedValue(() => ({
    time: time.value,
    pressed: activePressed.value,
    size: vec(width, height),
  }));
  
  const chromaticMatrix = useMemo(() => [
    1, 0, 0, 0, 0,
    0, 1.05, 0, 0, 0,
    0, 0, 1.1, 0, 0,
    0, 0, 0, 1, 0,
  ], []);

  const tintColor = mode === 'dark' ? 'rgba(30, 30, 40, 0.7)' : 'rgba(235, 245, 255, 0.7)';

  return (
    <View style={[{ width, height }, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Base Neumorphic Shadow */}
        <RoundedRect
          x={4}
          y={8}
          width={width - 8}
          height={height - 8}
          r={borderRadius}
          color="transparent"
        >
          <Shadow dx={0} dy={8} blur={32} color="rgba(0,0,0,0.15)" />
        </RoundedRect>

        <Group>
          {/* Glass Core with Chromatic Aberration & High-End Refraction */}
          <BackdropFilter filter={
            <Group>
              <Blur blur={25} />
              <ColorMatrix matrix={chromaticMatrix} />
              {/* Refraction Displacement Map */}
              <DisplacementMap scale={15}>
                <Turbulence freqX={0.01} freqY={0.01} octaves={2} seed={1} />
              </DisplacementMap>
            </Group>
          }>
            <Fill color="transparent" />
          </BackdropFilter>
          
          {/* The "Liquid" Surface Layer */}
          <Group>
            <RuntimeShader source={liquidShader} uniforms={uniforms}>
               <LinearGradient
                start={vec(0, 0)}
                end={vec(0, height)}
                colors={[mode === 'dark' ? 'rgba(60,60,75,0.4)' : 'rgba(255,255,255,0.5)', tintColor]}
              />
            </RuntimeShader>
            <Shadow dx={0} dy={2} blur={4} color="rgba(255,255,255,0.1)" inner />
          </Group>

          {/* Grain Texture Overlay */}
          <Rect x={0} y={0} width={width} height={height} opacity={0.03}>
            <Turbulence freqX={0.5} freqY={0.5} octaves={4} seed={2} />
          </Rect>

          {/* Specular Highlight (Rim Light) */}
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height * 0.35}
            r={borderRadius}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height * 0.35)}
              colors={['rgba(255,255,255,0.25)', 'transparent']}
            />
          </RoundedRect>

          {/* Beveled Edge */}
          <Paint style="stroke" strokeWidth={1.5}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.05)']}
            />
          </Paint>
          <RoundedRect
            x={0.75}
            y={0.75}
            width={width - 1.5}
            height={height - 1.5}
            r={borderRadius}
          />
        </Group>
      </Canvas>

      <View style={[StyleSheet.absoluteFill, styles.content, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

const styles = StyleSheet.create({
  content: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  }
});