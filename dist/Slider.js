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
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_native_reanimated_1 = __importStar(require("react-native-reanimated"));
var react_native_gesture_handler_1 = require("react-native-gesture-handler");
var theme_1 = require("./theme");
var Slider = function (_a) {
    var _b;
    var _c = _a.value, value = _c === void 0 ? 0 : _c, _d = _a.minimumValue, minimumValue = _d === void 0 ? 0 : _d, _e = _a.maximumValue, maximumValue = _e === void 0 ? 1 : _e, _f = _a.step, step = _f === void 0 ? 0.01 : _f, onValueChange = _a.onValueChange, _g = _a.disabled, disabled = _g === void 0 ? false : _g, trackStyle = _a.trackStyle, activeColor = _a.activeColor, containerStyle = _a.containerStyle, thumbStyle = _a.thumbStyle, accessibilityLabel = _a.accessibilityLabel, accessibilityHint = _a.accessibilityHint;
    var theme = (0, theme_1.useTheme)();
    var colors = (0, theme_1.useColors)();
    var _h = (0, react_1.useState)(0), containerWidth = _h[0], setContainerWidth = _h[1];
    var trackWidth = (0, react_native_reanimated_1.useSharedValue)(0);
    var thumbX = (0, react_native_reanimated_1.useSharedValue)(0);
    var currentValue = (0, react_native_reanimated_1.useSharedValue)(value);
    var currentThumbPosition = (0, react_native_reanimated_1.useSharedValue)(0);
    var valueToPosition = function (val) {
        'worklet';
        var clamped = Math.max(minimumValue, Math.min(val, maximumValue));
        var ratio = (clamped - minimumValue) / (maximumValue - minimumValue);
        return ratio * trackWidth.value;
    };
    var positionToValue = function (pos) {
        'worklet';
        var ratio = pos / trackWidth.value;
        var rawValue = ratio * (maximumValue - minimumValue) + minimumValue;
        var steppedValue = step > 0 ? Math.round(rawValue / step) * step : rawValue;
        return Math.max(minimumValue, Math.min(steppedValue, maximumValue));
    };
    (0, react_1.useEffect)(function () {
        var pos = valueToPosition(value);
        thumbX.value = (0, react_native_reanimated_1.withTiming)(pos, { duration: 150 });
        currentThumbPosition.value = pos;
        currentValue.value = value;
    }, [value]);
    var thumbRadius = (((_b = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _b === void 0 ? void 0 : _b.THUMB_SIZE) || 25) / 2;
    var panGesture = react_native_gesture_handler_1.Gesture.Pan()
        .onStart(function (e) {
        if (disabled)
            return;
        var clampedX = Math.max(thumbRadius, Math.min(e.x, trackWidth.value - thumbRadius));
        currentThumbPosition.value = clampedX;
        thumbX.value = clampedX;
    })
        .onUpdate(function (e) {
        if (disabled)
            return;
        var clampedX = Math.max(thumbRadius, Math.min(e.x, trackWidth.value - thumbRadius));
        currentThumbPosition.value = clampedX;
        thumbX.value = clampedX;
        var newValue = positionToValue(clampedX);
        if (newValue !== currentValue.value) {
            currentValue.value = newValue;
            if (onValueChange) {
                (0, react_native_reanimated_1.runOnJS)(onValueChange)(newValue);
            }
        }
    });
    var onTrackLayout = function (e) {
        var width = e.nativeEvent.layout.width;
        trackWidth.value = width;
        thumbX.value = valueToPosition(currentValue.value);
    };
    var handleContainerLayout = function (event) {
        var width = event.nativeEvent.layout.width;
        setContainerWidth(Math.round(width));
    };
    // Resolve theme palette key for activeColor
    var resolvedActiveColor = activeColor
        ? colors[activeColor] || activeColor
        : colors.primary;
    var animatedThumbStyle = (0, react_native_reanimated_1.useAnimatedStyle)(function () { return ({
        transform: [{ translateX: thumbX.value }],
    }); });
    var animatedActiveTrackStyle = (0, react_native_reanimated_1.useAnimatedStyle)(function () { return ({
        width: thumbX.value,
    }); });
    return (<react_native_1.View style={[styles(theme, colors).container, containerStyle]} onLayout={handleContainerLayout}>
      <react_native_1.View onLayout={onTrackLayout} style={[styles(theme, colors).track, trackStyle]}/>
      <react_native_reanimated_1.default.View style={[styles(theme, colors).activeTrack, { backgroundColor: resolvedActiveColor }, animatedActiveTrackStyle]}>
        <react_native_gesture_handler_1.GestureDetector gesture={panGesture}>
          <react_native_reanimated_1.default.View style={[
            styles(theme, colors).thumb,
            thumbStyle,
            disabled && styles(theme, colors).disabled,
            animatedThumbStyle,
        ]}/>
        </react_native_gesture_handler_1.GestureDetector>
      </react_native_reanimated_1.default.View>
    </react_native_1.View>);
};
var styles = function (theme, colors) {
    var _a, _b, _c, _d, _e, _f, _g;
    return react_native_1.StyleSheet.create({
        container: {
            height: 40,
            justifyContent: 'center',
        },
        track: {
            height: ((_a = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _a === void 0 ? void 0 : _a.TRACK_SIZE) || 4,
            width: '100%',
            borderRadius: (((_b = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _b === void 0 ? void 0 : _b.TRACK_SIZE) || 4) / 2,
            position: 'absolute',
            backgroundColor: colors.surface || colors.background || '#E0E0E0',
        },
        activeTrack: {
            height: ((_c = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _c === void 0 ? void 0 : _c.TRACK_SIZE) || 4,
            position: 'absolute',
            borderRadius: (((_d = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _d === void 0 ? void 0 : _d.TRACK_SIZE) || 4) / 2,
        },
        thumb: {
            width: ((_e = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _e === void 0 ? void 0 : _e.THUMB_SIZE) || 25,
            height: ((_f = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _f === void 0 ? void 0 : _f.THUMB_SIZE) || 25,
            borderRadius: (((_g = theme === null || theme === void 0 ? void 0 : theme.sizes) === null || _g === void 0 ? void 0 : _g.THUMB_SIZE) || 25) / 2,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: colors.white,
            position: 'absolute',
            marginTop: -10,
        },
        disabled: {
            backgroundColor: colors.surfaceVariant || colors.background || '#999999',
            borderColor: colors.surfaceVariant || colors.background || '#999999',
        },
    });
};
exports.default = Slider;
//# sourceMappingURL=Slider.js.map