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
exports.useQrScanner = useQrScanner;
var vue_1 = require("vue");
var useSnackbar_1 = require("./useSnackbar");
/**
 * Vietnamese error messages for QR scanner errors
 */
var errorMessages = {
    NotAllowedError: 'Bạn cần cấp quyền truy cập camera để quét mã QR',
    NotFoundError: 'Không tìm thấy camera trên thiết bị này',
    NotSupportedError: 'Trình duyệt không hỗ trợ quét mã QR',
    NotReadableError: 'Camera đang được sử dụng bởi ứng dụng khác',
    OverconstrainedError: 'Camera không đáp ứng yêu cầu cấu hình',
    SecurityError: 'Cần kết nối HTTPS để sử dụng camera',
    StreamApiNotSupportedError: 'Trình duyệt không hỗ trợ API camera',
};
/**
 * Composable for QR code scanning functionality
 * Provides unified API for QR scanning with Vietnamese error messages
 *
 * @example
 * ```ts
 * const {
 *   isScanning,
 *   lastDetectedCode,
 *   handleDetect,
 *   handleError,
 *   start,
 *   stop
 * } = useQrScanner({
 *   onDetect: (codes) => console.log('Detected:', codes),
 *   vibrate: true
 * })
 * ```
 */
function useQrScanner(options) {
    if (options === void 0) { options = {}; }
    var onDetect = options.onDetect, onError = options.onError, _a = options.autoStart, autoStart = _a === void 0 ? false : _a, _b = options.vibrate, vibrate = _b === void 0 ? true : _b, _c = options.playSound, playSound = _c === void 0 ? false : _c;
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    // State
    var isScanning = (0, vue_1.ref)(autoStart);
    var isLoading = (0, vue_1.ref)(false);
    var error = (0, vue_1.ref)(null);
    var lastDetectedCode = (0, vue_1.ref)(null);
    var detectionHistory = (0, vue_1.ref)([]);
    // Audio context for sound feedback
    var audioContext = null;
    /**
     * Get Vietnamese error message
     */
    var getErrorMessage = function (err) {
        return errorMessages[err.name] || err.message || 'Đã xảy ra lỗi không xác định';
    };
    /**
     * Play detection sound
     */
    var playDetectionSound = function () {
        if (!playSound)
            return;
        try {
            if (!audioContext) {
                audioContext = new AudioContext();
            }
            var oscillator = audioContext.createOscillator();
            var gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
        catch (_a) {
            // Ignore audio errors
        }
    };
    /**
     * Vibrate device on detection
     */
    var vibrateDevice = function () {
        if (!vibrate)
            return;
        try {
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }
        catch (_a) {
            // Ignore vibration errors
        }
    };
    /**
     * Handle QR code detection
     */
    var handleDetect = function (codes) {
        if (codes.length === 0)
            return;
        var detectedCode = codes[0];
        if (!detectedCode)
            return;
        lastDetectedCode.value = detectedCode.rawValue;
        // Add to history (avoid duplicates in quick succession)
        var lastInHistory = detectionHistory.value[0];
        if (!lastInHistory || lastInHistory.rawValue !== detectedCode.rawValue) {
            detectionHistory.value.unshift(__assign({}, detectedCode));
            // Keep only last 50 entries
            if (detectionHistory.value.length > 50) {
                detectionHistory.value = detectionHistory.value.slice(0, 50);
            }
        }
        // Feedback
        vibrateDevice();
        playDetectionSound();
        // Callback
        onDetect === null || onDetect === void 0 ? void 0 : onDetect(codes);
    };
    /**
     * Handle scanner error
     */
    var handleError = function (err) {
        error.value = err;
        isScanning.value = false;
        var message = getErrorMessage(err);
        snackbar.error(message);
        onError === null || onError === void 0 ? void 0 : onError(err);
    };
    /**
     * Handle camera ready event
     */
    var handleCameraOn = function () {
        isLoading.value = false;
        error.value = null;
    };
    /**
     * Handle camera loading
     */
    var handleCameraOff = function () {
        isLoading.value = true;
    };
    /**
     * Start scanning
     */
    var start = function () {
        isScanning.value = true;
        error.value = null;
    };
    /**
     * Stop scanning
     */
    var stop = function () {
        isScanning.value = false;
    };
    /**
     * Toggle scanning
     */
    var toggle = function () {
        if (isScanning.value) {
            stop();
        }
        else {
            start();
        }
    };
    /**
     * Clear detection history
     */
    var clearHistory = function () {
        detectionHistory.value = [];
        lastDetectedCode.value = null;
    };
    /**
     * Check if camera is available
     */
    var hasCamera = (0, vue_1.computed)(function () {
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    });
    /**
     * Check if running on HTTPS (required for camera)
     */
    var isSecureContext = (0, vue_1.computed)(function () {
        return window.isSecureContext || window.location.hostname === 'localhost';
    });
    return {
        // State
        isScanning: isScanning,
        isLoading: isLoading,
        error: error,
        lastDetectedCode: lastDetectedCode,
        detectionHistory: detectionHistory,
        // Computed
        hasCamera: hasCamera,
        isSecureContext: isSecureContext,
        // Methods
        start: start,
        stop: stop,
        toggle: toggle,
        clearHistory: clearHistory,
        handleDetect: handleDetect,
        handleError: handleError,
        handleCameraOn: handleCameraOn,
        handleCameraOff: handleCameraOff,
        getErrorMessage: getErrorMessage,
    };
}
