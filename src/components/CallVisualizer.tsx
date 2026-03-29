import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/src/constants/uiTheme';

const BAR_COUNT = 5;

interface CallVisualizerProps {
  active: boolean;
}

export function CallVisualizer({ active }: CallVisualizerProps) {
  const animated = useRef(
    Array.from({ length: BAR_COUNT }, () => ({
      scale: new Animated.Value(0.25),
      opacity: new Animated.Value(0.5),
    })),
  ).current;

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];

    if (active) {
      animated.forEach((bar, index) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(index * 90),
            Animated.parallel([
              Animated.timing(bar.scale, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(bar.opacity, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(bar.scale, {
                toValue: 0.25,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(bar.opacity, {
                toValue: 0.45,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
          ]),
        );
        loops.push(loop);
        loop.start();
      });
    } else {
      animated.forEach((bar) => {
        bar.scale.setValue(0.25);
        bar.opacity.setValue(0.5);
      });
    }

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [active, animated]);

  return (
    <View style={styles.row}>
      {animated.map((bar, index) => (
        <Animated.View
          key={`bar-${index}`}
          style={[
            styles.bar,
            {
              opacity: bar.opacity,
              transform: [{ scaleY: bar.scale }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  bar: {
    width: 5,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});
