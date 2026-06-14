import { JSX, useEffect, useState, useMemo, useCallback } from "react";
import { Dimensions, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { useTheme, useColors } from "./theme";
import Block from "./Block";
import { registerInterop } from './helpers/interop';    


const { width: SCREEN_WIDTH } = Dimensions.get('screen');

interface DeckSwiperProps {
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    focusedElementStyle?: StyleProp<ViewStyle>;
    nextElementStyle?: StyleProp<ViewStyle>;
    components: React.ReactNode[];
    style?: StyleProp<ViewStyle>;
    swipeThreshold?: number;
    cardWidth?: number;
    cardContainerStyle?: StyleProp<ViewStyle>;
    cardShadow?: keyof ReturnType<typeof useTheme>["shadows"] | ViewStyle;
    cardBackgroundColor?: string;
    nextCardBackgroundColor?: string;
    nextCardShadow?: keyof ReturnType<typeof useTheme>["shadows"] | ViewStyle;
    borderRadius?: number;
    showNextCard?: boolean;
    
    className?:string;
    focusedElementClassName?:string;
    nextElementClassName?:string;
    cardContainerClassName?:string;

}

function DeckSwiper({
    onSwipeRight,
    onSwipeLeft,
    focusedElementStyle = {},
    nextElementStyle = {},
    components,
    style,
    swipeThreshold = 110,
    cardWidth = SCREEN_WIDTH * 0.7,
    cardContainerStyle = {},
    cardShadow = 'md',
    cardBackgroundColor,
    nextCardBackgroundColor,
    nextCardShadow = 'sm',
    borderRadius,
    showNextCard = true,
    
    className,
    focusedElementClassName,
    nextElementClassName,
    cardContainerClassName
}: DeckSwiperProps): JSX.Element {
    const theme = useTheme();
    const colors = useColors();
    const [currentIndex, setCurrentIndex] = useState(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const rotateAndTranslate = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-cardWidth / 2, 0, cardWidth / 2],
            [-10, 0, 10],
            Extrapolation.CLAMP
        ) + 'deg';
        
        return {
            transform: [
                { rotate },
                { translateX: translateX.value },
                { translateY: translateY.value }
            ]
        };
    });

    const nextCardAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [-cardWidth / 2, 0, cardWidth / 2],
            [1, 0, 1],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            translateX.value,
            [-cardWidth / 2, 0, cardWidth / 2],
            [1, 0.8, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ scale }],
            ...StyleSheet.absoluteFillObject
        };
    });

    const handleSwipeRight = useCallback(() => {
        if (currentIndex < components.length - 1) {
            setCurrentIndex(prev => prev + 1);
            onSwipeRight?.();
        }
    }, [currentIndex, components.length, onSwipeRight]);

    const handleSwipeLeft = useCallback(() => {
        if (currentIndex < components.length - 1) {
            setCurrentIndex(prev => prev + 1);
            onSwipeLeft?.();
        }
    }, [currentIndex, components.length, onSwipeLeft]);

    const panGesture = useMemo(() => Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationX > swipeThreshold) {
                translateX.value = withSpring(cardWidth + 100, undefined, (isFinished) => {
                    if (isFinished) runOnJS(handleSwipeRight)();
                });
                translateY.value = withSpring(event.translationY);
            } else if (event.translationX < -swipeThreshold) {
                translateX.value = withSpring(-cardWidth - 100, undefined, (isFinished) => {
                    if (isFinished) runOnJS(handleSwipeLeft)();
                });
                translateY.value = withSpring(event.translationY);
            } else {
                translateX.value = withSpring(0, { damping: 10 });
                translateY.value = withSpring(0, { damping: 10 });
            }
        }), [swipeThreshold, cardWidth, handleSwipeRight, handleSwipeLeft]);

    useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
    }, [currentIndex]);

    const renderComponents = useCallback((componentsArray: React.ReactNode[]) => {
        return componentsArray.map((item, i) => {
            if (i < currentIndex) {
                return null;
            } else if (i === currentIndex) {
                return (
                    <GestureDetector key={i} gesture={panGesture}>
                        <Animated.View
                            style={[
                                rotateAndTranslate,
                                StyleSheet.absoluteFillObject,
                                {
                                    backgroundColor: cardBackgroundColor || colors.surface,
                                    borderRadius: borderRadius ?? theme.sizes.CARD_BORDER_RADIUS,
                                    ...(typeof cardShadow === 'string' ? theme.shadows[cardShadow] : cardShadow),
                                },
                                cardContainerStyle,
                                focusedElementStyle,
                            ]}
                        >
                            {item}
                        </Animated.View>
                    </GestureDetector>
                );
            } else if (showNextCard && i === currentIndex + 1) {
                return (
                    <Animated.View
                        key={i}
                        style={[
                            nextCardAnimatedStyle,
                            {
                                backgroundColor: nextCardBackgroundColor || colors.background,
                                borderRadius: borderRadius ?? theme.sizes.CARD_BORDER_RADIUS,
                                ...(typeof nextCardShadow === 'string' ? theme.shadows[nextCardShadow] : nextCardShadow),
                            },
                            nextElementStyle,
                        ]}
                    >
                        {item}
                    </Animated.View>
                );
            } else {
                return null;
            }
        }).reverse();
    }, [currentIndex, rotateAndTranslate, focusedElementStyle, nextCardAnimatedStyle, cardBackgroundColor, nextCardBackgroundColor, cardShadow, nextCardShadow, cardContainerStyle, nextElementStyle, borderRadius, theme, colors, showNextCard, panGesture]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [components.length]);

    const blockStyle: ViewStyle = {
        width: cardWidth,
        ...(Array.isArray(style) ? Object.assign({}, ...style) : (style || {})),
    };

    if (components.length === 0) {
        return <Block flex center style={blockStyle} />;
    }

    return (
        <Block flex center style={blockStyle}>
            {renderComponents(components)}
        </Block>
    );
}

const WrappedDeckSwiper=registerInterop(DeckSwiper,{
    className: 'style',
    focusedElementClassName: 'focusedElementStyle',
    nextElementClassName: 'nextElementStyle',
    cardContainerClassName: 'cardContainerStyle',
})
export default WrappedDeckSwiper;