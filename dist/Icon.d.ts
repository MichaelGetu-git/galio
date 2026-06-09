import React from 'react';
import type { JSX } from 'react';
export interface IconProps {
    name: string;
    family: string;
    size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    style?: any;
    [key: string]: any;
}
declare function Icon({ name, family, size, color, style, ...rest }: IconProps): JSX.Element | null;
declare const WrappedIcon: React.MemoExoticComponent<typeof Icon>;
export default WrappedIcon;
//# sourceMappingURL=Icon.d.ts.map