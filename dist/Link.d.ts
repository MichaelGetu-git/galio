import React from 'react';
import { TextStyle, ViewStyle } from 'react-native';
export interface LinkProps {
    children?: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    color?: string;
    disabled?: boolean;
    activeOpacity?: number;
    className?: string;
    textClassName?: string;
}
export interface linkRef {
    press: () => void;
}
declare const WrappedLink: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<linkRef>>;
export default WrappedLink;
//# sourceMappingURL=Link.d.ts.map