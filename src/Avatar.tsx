import { JSX } from "react";
import { StyleSheet, ViewStyle, View, Text, Image, ImageSourcePropType, Platform, ImageStyle, TextStyle } from "react-native";
import { useTheme, useColors, validateShadowKey } from "./theme";
import { registerInterop } from './helpers/interop';  
interface AvatarProps {
    /**
     * Semantic shadow level: 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'default', 'strong'.
     * If not set, no shadow is applied.
     */
    shadow?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'default' | 'strong';
    /**
     * Image source for the avatar (URL, require, etc.)
     */
    source?: ImageSourcePropType;
    /**
     * Text or initials to display if no image is provided
     */
    label?: string;
    /**
     * Color for the label text
     */
    labelColor?: string;
    /**
     * Size of the avatar (width & height)
     */
    size?: number;
    /**
     * Background color for the avatar
     */
    backgroundColor?: string;
    /**
     * Font size for the label text
     */
    labelFontSize?: number;
    /**
     * Font weight for the label text
     */
    labelFontWeight?: TextStyle['fontWeight'];
    /**
     * Props to pass to the underlying Image component
     */
    imageProps?: object;
    /**
     * Style for the Image component
     */
    imageStyle?: ImageStyle;
    /**
     * Style for the avatar container (outer View)
     */
    containerStyle?: ViewStyle;
    /**
     * Additional style for the outermost View
     */
    style?: ViewStyle;
    /**
     * Style for the label container (View around Text)
     */
    labelStyle?: ViewStyle;
    /**
     * Style for the label Text
     */
    labelTextStyle?: TextStyle;
    /**
     * Accessibility label for screen readers
     */
    accessibilityLabel?: string;
    /**
     * Accessibility hint for screen readers
     */
    accessibilityHint?: string;

    className?:string;
    imageClassName?:string;
    containerClassName?:string;
    labelClassName?:string;
    labelTextClassName?:string;
}


function Avatar({
    source,
    label,
    labelColor,
    size = 50,
    backgroundColor,
    labelFontSize,
    labelFontWeight,
    imageProps,
    imageStyle,
    containerStyle,
    style,
    labelStyle,
    labelTextStyle,
    accessibilityLabel,
    accessibilityHint,
    shadow,
    className,
    imageClassName,
    containerClassName,
    labelClassName,
    labelTextClassName
}: AvatarProps): JSX.Element {
    const theme = useTheme();
    const colors = theme.colors;
    const avatarSize = size || 50;

    // Validate shadow key (only if not 'none')
    const validatedShadow = shadow === 'none' ? 'none' : validateShadowKey(shadow, theme);

    // If shadow prop is set and not 'none', apply theme shadow for current platform
    let shadowStyle: ViewStyle = {};
    if (validatedShadow && validatedShadow !== 'none') {
        const shadowDef = theme.shadows?.[validatedShadow as keyof typeof theme.shadows] || {};
        shadowStyle = Platform.select({
            ios: (shadowDef.ios || {}) as ViewStyle,
            android: (shadowDef.android || {}) as ViewStyle,
            web: (shadowDef.web || {}) as ViewStyle,
        }) || {};
    }

    // Only apply overflow: 'hidden' if no shadow is present
    const containerBaseStyle: ViewStyle = {
        width: avatarSize,
        height: avatarSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: avatarSize / 2,
        backgroundColor: backgroundColor || colors.background,
        ...(shadow ? shadowStyle : { overflow: 'hidden' }),
    };

    const stylesheet = StyleSheet.create({
        container: {
            ...containerBaseStyle,
        },
        image: {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
        },
        label: {
            width: avatarSize,
            height: avatarSize,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: avatarSize / 2,
            backgroundColor: backgroundColor || colors.disabled,
        },
        labelText: {
            color: labelColor || colors.white,
            fontSize: labelFontSize !== undefined ? labelFontSize : Math.max(12, avatarSize * 0.32),
            fontWeight: labelFontWeight !== undefined ? labelFontWeight : '600',
            textAlign: 'center',
        },
    });

    const defaultAccessibilityLabel = accessibilityLabel || 
        (label ? `Avatar with label ${label}` : 'Avatar image');

    return (
        <View 
            style={[stylesheet.container, containerStyle, style]}
            accessibilityRole="image"
            accessibilityLabel={defaultAccessibilityLabel}
            accessibilityHint={accessibilityHint}
        >
            {source ? (
                <Image 
                    source={source}
                    style={[stylesheet.image, imageStyle]}
                    {...imageProps}
                />
            ) : label ? (
                <View style={[stylesheet.label, labelStyle]}>
                    <Text numberOfLines={1} style={[stylesheet.labelText, labelTextStyle]}>
                        {label}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const WrappedAvatar=registerInterop(Avatar,{
    className: 'style',
    imageClassName: 'imageStyle',
    containerClassName: 'containerStyle',
    labelClassName: 'labelStyle',
    labelTextClassName: 'labelTextStyle',
})
export default WrappedAvatar;

