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
exports.useSnackbar = useSnackbar;
var quasar_1 = require("quasar");
function useSnackbar() {
    var $q = (0, quasar_1.useQuasar)();
    // Map type to icon (using Material Icons format, not MDI)
    var getIcon = function (type) {
        var iconMap = {
            positive: 'check_circle', // Material Icons format
            negative: 'error', // Material Icons format
            warning: 'warning', // Material Icons format
            info: 'info', // Material Icons format
            ongoing: 'hourglass_empty' // Material Icons format (for loading spinner case)
        };
        return iconMap[type] || 'info';
    };
    /**
     * Show a notification
     */
    var show = function (options) {
        var config = typeof options === 'string'
            ? { message: options }
            : options;
        var message = config.message, type = config.type, color = config.color, textColor = config.textColor, icon = config.icon, _a = config.timeout, timeout = _a === void 0 ? 3000 : _a, _b = config.position, position = _b === void 0 ? 'top' : _b, caption = config.caption, _c = config.html, html = _c === void 0 ? false : _c, actions = config.actions, _d = config.progress, progress = _d === void 0 ? false : _d, _e = config.multiLine, multiLine = _e === void 0 ? false : _e;
        // Use conditional spread to only include optional properties when defined
        // This allows the `type` property to provide default colors/styling
        var computedIcon = icon || (type ? getIcon(type) : undefined);
        var computedActions = actions === null || actions === void 0 ? void 0 : actions.map(function (a) { return ({
            label: a.label,
            color: a.color || 'white',
            handler: a.handler
        }); });
        $q.notify(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ message: message, type: type }, (color && { color: color })), (textColor && { textColor: textColor })), (computedIcon && { icon: computedIcon })), { timeout: timeout, position: position }), (caption && { caption: caption })), { html: html }), (computedActions && { actions: computedActions })), { progress: progress, multiLine: multiLine }));
    };
    /**
     * Success notification (green)
     */
    var success = function (message, timeout) {
        show({
            message: message,
            type: 'positive',
            timeout: timeout || 3000
        });
    };
    /**
     * Error notification (red)
     */
    var error = function (message, timeout) {
        show({
            message: message,
            type: 'negative',
            timeout: timeout || 5000
        });
    };
    /**
     * Warning notification (orange)
     */
    var warning = function (message, timeout) {
        show({
            message: message,
            type: 'warning',
            timeout: timeout || 4000
        });
    };
    /**
     * Info notification (blue)
     */
    var info = function (message, timeout) {
        show({
            message: message,
            type: 'info',
            timeout: timeout || 3000
        });
    };
    /**
     * Ongoing/loading notification (returns dismiss function)
     */
    var loading = function (message) {
        var dismiss = $q.notify({
            message: message,
            type: 'ongoing',
            spinner: true,
            timeout: 0, // Persistent until dismissed
            position: 'top'
        });
        return dismiss;
    };
    return {
        show: show,
        success: success,
        error: error,
        warning: warning,
        info: info,
        loading: loading
    };
}
