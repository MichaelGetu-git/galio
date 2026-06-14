"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE = void 0;
var react_native_1 = require("react-native");
var staticSizes_1 = require("./staticSizes");
Object.defineProperty(exports, "BASE", { enumerable: true, get: function () { return staticSizes_1.BASE; } });
var _a = react_native_1.Dimensions.get('screen'), height = _a.height, width = _a.width;
var SIZES = __assign(__assign({}, staticSizes_1.STATIC_SIZES), { CARD_WIDTH: width - (staticSizes_1.BASE * 2), NAVBAR_TITLE_HEIGHT: height * 0.07, NAVBAR_LEFT_HEIGHT: height * 0.07, NAVBAR_RIGHT_HEIGHT: height * 0.07 });
exports.default = SIZES;
//# sourceMappingURL=sizes.js.map