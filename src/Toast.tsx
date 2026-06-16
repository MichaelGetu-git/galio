import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useTheme, useColors } from './theme';
import Text from './Text';
import { registerInterop } from './helpers/interop';

const { height } = Dimensions.get('screen');

interface ToastProps {
    children: React.ReactNode;
    isShow: boolean;
    positionIndicator?: 'top' | 'center' | 'bottom';
    positionOffset?: number;
    fadeInDuration?: number;
    fadeOutDuration?: number;
    color?: string;
    round?: boolean;
    style?: any;
    textStyle?: any;
    className?: string;
    textClassName?: string;
}

function Toast({
    children,
    isShow,
    positionIndicator = 'top',
    positionOffset = 120,
    fadeInDuration = 300,
    fadeOutDuration = 300,
    color = 'primary',
    round = false,
    style,
    textStyle,
}: ToastProps) {
    const theme = useTheme();
    const colors = useColors();
    const [internalIsShow, setInternalIsShow] = useState(isShow);
    const opacity = useSharedValue(isShow ? 1 : 0);

    const hideToast = () => {
        setInternalIsShow(false);
    };

    const getThemeColor = (colorName?: string) => {
        if (!colorName) return colors.primary;
        if (typeof colorName === 'string' && colorName.startsWith('#')) {
            return colorName;
        }
        const colorMap: { [key: string]: string } = {
            primary: colors.primary,
            success: colors.success,
            warning: colors.warning,
            error: colors.error,
            danger: colors.error,
            info: colors.info,
            white: colors.white,
            black: colors.black,
            onPrimary: colors.onPrimary,
        };
        return colorMap[colorName] || colors.primary;
    };

    const getTopPosition = () => {
        if (positionIndicator === 'top') {
            return positionOffset;
        }
        if (positionIndicator === 'bottom') {
            return height - positionOffset - 100;
        }
        return height / 2 - 50;
    };

    useEffect(() => {
        if (isShow) {
            setInternalIsShow(true);
            opacity.value = withTiming(1, { duration: fadeInDuration });
            return;
        }

        if (internalIsShow) {
            opacity.value = withTiming(0, { duration: fadeOutDuration }, (finished) => {
                if (finished) {
                    runOnJS(hideToast)();
                }
            });
        }
    }, [isShow, fadeInDuration, fadeOutDuration, internalIsShow, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const renderContent = () => {
        if (typeof children === 'string') {
            return <Text style={[styles(theme, colors).text, textStyle]}>{children}</Text>;
        }
        return children;
    };

    if (!internalIsShow) {
        return null;
    }

    const backgroundColor = getThemeColor(color);
    const borderRadius = round ? theme.sizes.BASE * 2 : theme.sizes.BASE;
    const topPosition = getTopPosition();

    return (
        <View style={styles(theme, colors).overlay} pointerEvents="none">
            <Animated.View
                style={[
                    styles(theme, colors).toast,
                    animatedStyle,
                    {
                        backgroundColor,
                        top: topPosition,
                        borderRadius,
                        borderColor: colors.border || 'rgba(255,255,255,0.3)',
                        shadowColor: colors.black,
                    },
                    style,
                ]}
            >
                {renderContent()}
            </Animated.View>
        </View>
    );
}

const styles = (theme: ReturnType<typeof useTheme>, colors: ReturnType<typeof useColors>) =>
    StyleSheet.create({
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            pointerEvents: 'none',
        },
        toast: {
            padding: theme.sizes.BASE * 1.5,
            position: 'absolute',
            left: theme.sizes.BASE,
            right: theme.sizes.BASE,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 15,
            minHeight: 60,
            borderWidth: 1,
        },
        text: {
            fontSize: theme.sizes.FONT,
            color: colors.onPrimary || colors.white,
            textAlign: 'center',
            fontWeight: theme.fontWeights?.bold || '600',
        },
    });

const WrappedToast = registerInterop(Toast, {
    className: 'style',
    textClassName: 'textStyle',
});

export default WrappedToast;
