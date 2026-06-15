import React, { JSX } from "react";
import { TextProps, TextStyle, ViewStyle } from "react-native";
interface NavBarProps {
    back?: boolean;
    hideLeft?: boolean;
    hideRight?: boolean;
    left?: React.ReactNode;
    leftStyle?: ViewStyle;
    leftIconColor?: string;
    leftHitSlop?: number;
    leftIconSize?: number;
    leftIconName?: string;
    leftIconFamily?: string;
    onLeftPress?: () => void;
    right?: React.ReactNode;
    rightStyle?: ViewStyle;
    style?: ViewStyle;
    transparent?: boolean;
    title?: React.ReactNode;
    titleStyle?: TextStyle;
    titleNumberOfLines?: number;
    titleTextProps?: TextProps;
    accessibilityLabel?: string;
    className?: string;
    titleClassName?: string;
    leftClassName?: string;
    rightClassName?: string;
}
declare function NavBar({ back, hideLeft, hideRight, left, leftIconColor, leftHitSlop, leftIconSize, leftIconName, leftStyle, leftIconFamily, onLeftPress, right, rightStyle, style, transparent, title, titleStyle, titleNumberOfLines, titleTextProps, accessibilityLabel, className, titleClassName, leftClassName, rightClassName }: NavBarProps): JSX.Element;
declare const WrappedNavBar: typeof NavBar;
export default WrappedNavBar;
//# sourceMappingURL=NavBar.d.ts.map