// Shared motion: springy press feedback, staggered entrances, animated
// progress and light haptics. Reanimated follows the system Reduce Motion
// setting for layout animations; the hand-driven ones check it themselves.

import * as Haptics from 'expo-haptics';
import { useEffect, type ReactNode } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export const haptic = {
  tap: () => Platform.OS !== 'web' && Haptics.selectionAsync().catch(() => {}),
  success: () =>
    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
};

/** Staggered fade-up for list items; later items stop adding delay so long lists don't lag */
export const enter = (index = 0) =>
  FadeInDown.duration(320)
    .delay(Math.min(index, 8) * 45)
    .springify()
    .damping(20);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held */
  scaleTo?: number;
  children: ReactNode;
};

/** Pressable that shrinks slightly under the finger and springs back */
export function PressableScale({
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        if (!reduce) scale.set(withSpring(scaleTo, SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

/** Rounded progress bar that animates to its new value */
export function Progress({
  value,
  color,
  track,
  height = 6,
}: {
  value: number;
  color: string;
  track: string;
  height?: number;
}) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(reduce ? value : 0);
  useEffect(() => {
    progress.set(reduce ? value : withTiming(value, { duration: 600 }));
  }, [value, reduce, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, progress.value)) * 100}%` }));
  return (
    <Animated.View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fill]} />
    </Animated.View>
  );
}
