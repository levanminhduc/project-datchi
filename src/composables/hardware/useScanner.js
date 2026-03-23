"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScanner = useScanner;
var vue_1 = require("vue");
function useScanner(options) {
    var lastBarcode = (0, vue_1.ref)('');
    var isScanning = (0, vue_1.ref)(false);
    var enabled = (0, vue_1.ref)(true);
    // Buffer for accumulating keystrokes
    var buffer = '';
    var lastKeyTime = 0;
    var handleKeyDown = function (event) {
        var _a, _b, _c;
        if (!enabled.value)
            return;
        var now = Date.now();
        // If too much time passed, reset buffer (manual typing vs scanner)
        if (now - lastKeyTime > ((_a = options === null || options === void 0 ? void 0 : options.maxDelay) !== null && _a !== void 0 ? _a : 50)) {
            buffer = '';
        }
        lastKeyTime = now;
        // Scanner sends Enter at end of barcode
        if (event.key === 'Enter') {
            if (buffer.length >= ((_b = options === null || options === void 0 ? void 0 : options.minLength) !== null && _b !== void 0 ? _b : 5)) {
                lastBarcode.value = buffer;
                isScanning.value = true;
                (_c = options === null || options === void 0 ? void 0 : options.onScan) === null || _c === void 0 ? void 0 : _c.call(options, buffer);
                setTimeout(function () { isScanning.value = false; }, 300);
            }
            buffer = '';
            return;
        }
        // Accumulate alphanumeric characters
        if (event.key.length === 1 && /[a-zA-Z0-9\-_]/.test(event.key)) {
            buffer += event.key;
        }
    };
    var enable = function () { enabled.value = true; };
    var disable = function () { enabled.value = false; };
    var clear = function () { lastBarcode.value = ''; };
    (0, vue_1.onMounted)(function () {
        window.addEventListener('keydown', handleKeyDown);
    });
    (0, vue_1.onUnmounted)(function () {
        window.removeEventListener('keydown', handleKeyDown);
    });
    return {
        lastBarcode: lastBarcode,
        isScanning: isScanning,
        enabled: enabled,
        enable: enable,
        disable: disable,
        clear: clear,
    };
}
