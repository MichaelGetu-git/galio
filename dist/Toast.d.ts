import React from 'react';
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
declare function Toast({ children, isShow, positionIndicator, positionOffset, fadeInDuration, fadeOutDuration, color, round, style, textStyle, }: ToastProps): React.JSX.Element | null;
declare const WrappedToast: typeof Toast;
export default WrappedToast;
//# sourceMappingURL=Toast.d.ts.map