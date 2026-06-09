"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInterop = registerInterop;
/*registers a component with nativewind cssinterop if nativewind is installed */
function registerInterop(component, mappings) {
    try {
        var cssInterop = require('nativewind').cssInterop;
        cssInterop(component, mappings);
    }
    catch (error) {
    }
    return component;
}
//# sourceMappingURL=interop.js.map