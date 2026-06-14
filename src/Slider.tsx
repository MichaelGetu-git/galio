import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme, useColors } from './theme';

interface SliderProps {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  trackStyle?: ViewStyle;
  activeColor?: keyof ReturnType<typeof useColors> | string;
  thumbStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  onValueChange?: (value: number) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Slider: React.FC<SliderProps> = ({
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.01,
  onValueChange,
  disabled = false,
  trackStyle,
  activeColor,
  containerStyle,
  thumbStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();
  const colors = useColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const currentValue = useSharedValue(value);
  const currentThumbPosition = useSharedValue(0);

  const valueToPosition = (val: number) => {
    'worklet';
    const clamped = Math.max(minimumValue, Math.min(val, maximumValue));
    const ratio = (clamped - minimumValue) / (maximumValue - minimumValue);
    return ratio * trackWidth.value;
  };

  const positionToValue = (pos: number) => {
    'worklet';
    const ratio = pos / trackWidth.value;
    const rawValue = ratio * (maximumValue - minimumValue) + minimumValue;
    const steppedValue = step > 0 ? Math.round(rawValue / step) * step : rawValue;
    return Math.max(minimumValue, Math.min(steppedValue, maximumValue));
  };

  useEffect(() => {
    const pos = valueToPosition(value);
    thumbX.value = withTiming(pos, { duration: 150 });
    currentThumbPosition.value = pos;
    currentValue.value = value;
  }, [value]);

  const thumbRadius = (theme?.sizes?.THUMB_SIZE || 25) / 2;

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      if (disabled) return;
      const clampedX = Math.max(thumbRadius, Math.min(e.x, trackWidth.value - thumbRadius));
      currentThumbPosition.value = clampedX;
      thumbX.value = clampedX;
    })
    .onUpdate((e) => {
      if (disabled) return;
      const clampedX = Math.max(thumbRadius, Math.min(e.x, trackWidth.value - thumbRadius));
      currentThumbPosition.value = clampedX;
      thumbX.value = clampedX;
      const newValue = positionToValue(clampedX);
      if (newValue !== currentValue.value) {
        currentValue.value = newValue;
        if (onValueChange) {
          runOnJS(onValueChange)(newValue);
        }
      }
    });

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    trackWidth.value = width;
    thumbX.value = valueToPosition(currentValue.value);
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(Math.round(width));
  };

  // Resolve theme palette key for activeColor
  const resolvedActiveColor = activeColor
    ? colors[activeColor as keyof typeof colors] || activeColor
    : colors.primary;

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const animatedActiveTrackStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View
      style={[styles(theme, colors).container, containerStyle]}
      onLayout={handleContainerLayout}
    >
      <View
        onLayout={onTrackLayout}
        style={[styles(theme, colors).track, trackStyle]}
      />
      <Animated.View
        style={[styles(theme, colors).activeTrack, { backgroundColor: resolvedActiveColor }, animatedActiveTrackStyle]}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles(theme, colors).thumb,
              thumbStyle,
              disabled && styles(theme, colors).disabled,
              animatedThumbStyle,
            ]}
          />
        </GestureDetector>
      </Animated.View>
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>, colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      height: 40,
      justifyContent: 'center',
    },
    track: {
      height: theme?.sizes?.TRACK_SIZE || 4,
      width: '100%',
      borderRadius: (theme?.sizes?.TRACK_SIZE || 4) / 2,
      position: 'absolute',
      backgroundColor: colors.surface || colors.background || '#E0E0E0',
    },
    activeTrack: {
      height: theme?.sizes?.TRACK_SIZE || 4,
      position: 'absolute',
      borderRadius: (theme?.sizes?.TRACK_SIZE || 4) / 2,
    },
    thumb: {
      width: theme?.sizes?.THUMB_SIZE || 25,
      height: theme?.sizes?.THUMB_SIZE || 25,
      borderRadius: (theme?.sizes?.THUMB_SIZE || 25) / 2,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.white,
      position: 'absolute',
      marginTop: -10,
    },
    disabled: {
      backgroundColor: colors.surfaceVariant || colors.background || '#999999',
      borderColor: colors.surfaceVariant || colors.background || '#999999',
    },
  });

export default Slider;