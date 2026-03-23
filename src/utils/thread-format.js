"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatThreadTypeDisplay = formatThreadTypeDisplay;
function formatThreadTypeDisplay(supplierName, texNumber, colorName, fallbackName) {
    if (!supplierName)
        return fallbackName || '-';
    var parts = [supplierName, "TEX ".concat(texNumber !== null && texNumber !== void 0 ? texNumber : '?')];
    if (colorName)
        parts.push(colorName);
    return parts.join(' - ');
}
