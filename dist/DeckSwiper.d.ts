import { JSX } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "./theme";
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
declare function DeckSwiper({ onSwipeRight, onSwipeLeft, focusedElementStyle, nextElementStyle, components, style, swipeThreshold, cardWidth, cardContainerStyle, cardShadow, cardBackgroundColor, nextCardBackgroundColor, nextCardShadow, borderRadius, showNextCard, }: DeckSwiperProps): JSX.Element;
declare const WrappedDeckSwiper: typeof DeckSwiper;
export default WrappedDeckSwiper;
//# sourceMappingURL=DeckSwiper.d.ts.map