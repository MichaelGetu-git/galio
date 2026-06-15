"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
var theme_1 = require("./theme");
var Text_1 = __importDefault(require("./Text"));
var interop_1 = require("./helpers/interop");
var height = react_native_1.Dimensions.get('screen').height;
function Toast(_a) {
    var children = _a.children, isShow = _a.isShow, _b = _a.positionIndicator, positionIndicator = _b === void 0 ? 'top' : _b, _c = _a.positionOffset, positionOffset = _c === void 0 ? 120 : _c, _d = _a.fadeInDuration, fadeInDuration = _d === void 0 ? 300 : _d, _e = _a.fadeOutDuration, fadeOutDuration = _e === void 0 ? 300 : _e, _f = _a.color, color = _f === void 0 ? 'primary' : _f, _g = _a.round, round = _g === void 0 ? false : _g, style = _a.style, textStyle = _a.textStyle;
    var theme = (0, theme_1.useTheme)();
    var colors = (0, theme_1.useColors)();
    var _h = (0, react_1.useState)(isShow), internalIsShow = _h[0], setInternalIsShow = _h[1];
    var opacity = (0, react_native_reanimated_1.useSharedValue)(isShow ? 1 : 0);
    var hideToast = function () {
        setInternalIsShow(false);
    };
    var getThemeColor = function (colorName) {
        if (!colorName)
            return colors.primary;
        if (typeof colorName === 'string' && colorName.startsWith('#')) {
            return colorName;
        }
        var colorMap = {
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
    var getTopPosition = function () {
        if (positionIndicator === 'top') {
            return positionOffset;
        }
        if (positionIndicator === 'bottom') {
            return height - positionOffset - 100;
        }
        return height / 2 - 50;
    };
    (0, react_1.useEffect)(function () {
        if (isShow) {
            setInternalIsShow(true);
            opacity.value = (0, react_native_reanimated_1.withTiming)(1, { duration: fadeInDuration });
            return;
        }
        if (internalIsShow) {
            opacity.value = (0, react_native_reanimated_1.withTiming)(0, { duration: fadeOutDuration }, function (finished) {
                if (finished) {
                    (0, react_native_reanimated_1.runOnJS)(hideToast)();
                }
            });
        }
    }, [isShow, fadeInDuration, fadeOutDuration, internalIsShow, opacity]);
    var animatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(function () { return ({
        opacity: opacity.value,
    }); });
    var renderContent = function () {
        if (typeof children === 'string') {
            return <Text_1.default style={[styles(theme, colors).text, textStyle]}>{children}</Text_1.default>;
        }
        return children;
    };
    if (!internalIsShow) {
        return null;
    }
    var backgroundColor = getThemeColor(color);
    var borderRadius = round ? theme.sizes.BASE * 2 : theme.sizes.BASE;
    var topPosition = getTopPosition();
    return (<react_native_1.View style={styles(theme, colors).overlay} pointerEvents="none">
            <react_native_reanimated_1.default.View style={[
            styles(theme, colors).toast,
            animatedStyle,
            {
                backgroundColor: backgroundColor,
                top: topPosition,
                borderRadius: borderRadius,
                borderColor: colors.border || 'rgba(255,255,255,0.3)',
                shadowColor: colors.black,
            },
            style,
        ]}>
                {renderContent()}
            </react_native_reanimated_1.default.View>
        </react_native_1.View>);
}
var styles = function (theme, colors) {
    var _a;
    return react_native_1.StyleSheet.create({
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
            fontWeight: ((_a = theme.fontWeights) === null || _a === void 0 ? void 0 : _a.bold) || '600',
        },
    });
};
var WrappedToast = (0, interop_1.registerInterop)(Toast, {
    className: 'style',
    textClassName: 'textStyle',
});
exports.default = WrappedToast;
//# sourceMappingURL=Toast.js.map