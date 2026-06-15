import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useTheme, useColors } from "./theme";
import Block from "./Block";
import { registerInterop } from "./helpers/interop";

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
    className?: string;
    cardContainerClassName?: string;
    focusedElementClassName?: string;
    nextElementClassName?: string;
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
}: DeckSwiperProps): JSX.Element {
    const theme = useTheme();
    const colors = useColors();
    const [currentIndex, setCurrentIndex] = useState(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipeRight = useCallback(() => {
        if (currentIndex < components.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            onSwipeRight?.();
        }
    }, [currentIndex, components.length, onSwipeRight]);

    const handleSwipeLeft = useCallback(() => {
        if (currentIndex < components.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            onSwipeLeft?.();
        }
    }, [currentIndex, components.length, onSwipeLeft]);

    const resetPosition = useCallback(() => {
        translateX.value = 0;
        translateY.value = 0;
    }, [translateX, translateY]);

    useEffect(() => {
        resetPosition();
    }, [currentIndex, resetPosition]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [components.length]);

    const panGesture = useMemo(() => Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationX > swipeThreshold) {
                translateX.value = withSpring(cardWidth + 100, {}, (finished) => {
                    if (finished) {
                        runOnJS(handleSwipeRight)();
                    }
                });
            } else if (event.translationX < -swipeThreshold) {
                translateX.value = withSpring(-cardWidth - 100, {}, (finished) => {
                    if (finished) {
                        runOnJS(handleSwipeLeft)();
                    }
                });
            } else {
                translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
                translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            }
        }), [cardWidth, handleSwipeLeft, handleSwipeRight, swipeThreshold, translateX, translateY]);

    const focusedCardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-cardWidth / 2, 0, cardWidth / 2],
            [-10, 0, 10],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { rotate: `${rotate}deg` },
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    const nextCardAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-cardWidth / 2, 0, cardWidth / 2],
            [1, 0, 1],
            Extrapolation.CLAMP
        ),
        transform: [{
            scale: interpolate(
                translateX.value,
                [-cardWidth / 2, 0, cardWidth / 2],
                [1, 0.8, 1],
                Extrapolation.CLAMP
            ),
        }],
        ...StyleSheet.absoluteFillObject,
    }));

    const renderComponents = useCallback((componentsArray: React.ReactNode[]) => {
        return componentsArray.map((item, i) => {
            if (i < currentIndex) {
                return null;
            }

            if (i === currentIndex) {
                return (
                    <GestureDetector key={i} gesture={panGesture}>
                        <Animated.View
                            style={[
                                focusedCardStyle,
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
            }

            if (showNextCard && i === currentIndex + 1) {
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
            }

            return null;
        }).reverse();
    }, [
        currentIndex,
        panGesture,
        focusedCardStyle,
        nextCardAnimatedStyle,
        focusedElementStyle,
        cardBackgroundColor,
        nextCardBackgroundColor,
        cardShadow,
        nextCardShadow,
        cardContainerStyle,
        nextElementStyle,
        borderRadius,
        theme,
        colors,
        showNextCard,
        cardWidth,
    ]);

    const blockStyle: ViewStyle = {
        width: cardWidth,
        ...(Array.isArray(style) ? Object.assign({}, ...style) : (style || {})),
    };

    if (components.length === 0) {
        return <Block flex center style={blockStyle} />;
    }

    return (
        <Block flex center style={[blockStyle, { height: cardWidth * 1.2 }]}>
            {renderComponents(components)}
        </Block>
    );
}

const WrappedDeckSwiper = registerInterop(DeckSwiper, {
    className: 'style',
    cardContainerClassName: 'cardContainerStyle',
    focusedElementClassName: 'focusedElementStyle',
    nextElementClassName: 'nextElementStyle',
});

export default WrappedDeckSwiper;
