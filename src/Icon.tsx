import React, { memo, useState, useEffect } from 'react';
import type { JSX } from 'react';
import { Platform, Text } from 'react-native';
import { Fontisto } from '@react-native-vector-icons/fontisto';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import { registerInterop } from './helpers/interop';

import galioConfig from './config/galio.json';
import getIconType from './helpers/getIconType';
import { useTheme, useColors } from './theme';

const Galio = createIconSetFromIcoMoon(galioConfig, 'Galio', require('./fonts/galio.ttf'));

// Track if vector icons are loaded successfully (for web fallback)
let iconsLoaded = false;
let iconsLoadError = false;

export interface IconProps {
    name: string;
    family: string;
    size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: string; // can be a color string or a theme color key
    style?: any;
    [key: string]: any;

    className?:string;
}

function Icon({
    name,
    family,
    size,
    color,
    style,
    className,
    ...rest
}: IconProps): JSX.Element | null {
    const theme = useTheme();
    const colors = useColors();
    const [iconReady, setIconReady] = useState(Platform.OS !== 'web');

    // On web, attempt to load icons and fallback if they fail
    useEffect(() => {
        if (Platform.OS === 'web' && !iconsLoaded && !iconsLoadError) {
            // Set a timeout to detect if icons fail to load
            const timer = setTimeout(() => {
                if (!iconsLoaded) {
                    iconsLoadError = true;
                    setIconReady(false);
                }
            }, 1000); // 1 second timeout for icon loading

            // Try to mark icons as loaded (this is a simple heuristic)
            // In production, you'd want to use proper font loading detection
            try {
                iconsLoaded = true;
                setIconReady(true);
            } catch (e) {
                iconsLoadError = true;
                setIconReady(false);
            }

            return () => clearTimeout(timer);
        }
    }, []);

    // Semantic size mapping to theme sizes
    const sizeMap: Record<string, number> = {
        xs: theme.sizes.SMALL, // smallest icon size
        sm: theme.sizes.ICON, // default icon size
        md: theme.sizes.ICON_MEDIUM, // medium icon size
        lg: theme.sizes.ICON_LARGE, // large icon size
        xl: theme.sizes.ICON_LARGE * 1.5, // extra large, custom
    };

    let iconSize: number = sizeMap.sm;
    if (typeof size === 'string' && sizeMap[size]) {
        iconSize = sizeMap[size];
    } else if (typeof size === 'number') {
        iconSize = size;
    }

    // Color: if color matches a theme key, use theme color, else use as is or fallback
    let iconColor = color;
    if (iconColor && colors[iconColor as keyof typeof colors]) {
        iconColor = colors[iconColor as keyof typeof colors];
    }
    if (!iconColor) {
        iconColor = colors.text;
    }

    // Fallback for web when icons fail to load
    if (!iconReady && Platform.OS === 'web') {
        return name ? (
            <Text
                style={[
                    {
                        fontSize: iconSize,
                        color: iconColor,
                        fontFamily: 'monospace',
                    },
                    style,
                ]}
                {...rest}
            >
                [{name}]
            </Text>
        ) : null;
    }

    if (family === 'Galio') {
        return name ? <Galio name={name} size={iconSize} color={iconColor} style={style} {...rest} /> : null;
    }

    if (family === 'fontisto') {
        return name ? <Fontisto name={name as any} size={iconSize} color={iconColor} style={style} {...rest} /> : null;
    }

    const IconInstance = getIconType(family);
    return name && IconInstance ? (
        <IconInstance name={name} size={iconSize} color={iconColor} style={style} {...rest} />
    ) : null;
}

const MemoizedIcon = memo(Icon);

const WrappedIcon=registerInterop(MemoizedIcon,{
    className: 'style',
})
export default WrappedIcon;

