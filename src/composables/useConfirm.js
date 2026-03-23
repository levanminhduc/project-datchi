"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConfirm = useConfirm;
var quasar_1 = require("quasar");
function useConfirm() {
    var $q = (0, quasar_1.useQuasar)();
    // Map dialog type to color
    var getColor = function (type) {
        var colorMap = {
            info: 'info',
            warning: 'warning',
            error: 'negative',
            success: 'positive'
        };
        return colorMap[type] || 'primary';
    };
    /**
     * Show confirmation dialog
     * @param config - String message or full options object
     * @returns Promise that resolves to true if confirmed, false if cancelled
     */
    var confirm = function (config) {
        var options = typeof config === 'string'
            ? { message: config }
            : config;
        var _a = options.title, title = _a === void 0 ? 'Xác nhận' : _a, message = options.message, _b = options.confirmText, confirmText = _b === void 0 ? 'Đồng ý' : _b, _c = options.cancelText, cancelText = _c === void 0 ? 'Hủy' : _c, _d = options.type, type = _d === void 0 ? 'info' : _d, _e = options.html, html = _e === void 0 ? false : _e, _f = options.persistent, persistent = _f === void 0 ? false : _f, color = options.color, ok = options.ok;
        return new Promise(function (resolve) {
            $q.dialog({
                title: title,
                message: message,
                html: html,
                persistent: persistent,
                cancel: {
                    label: cancelText,
                    flat: true,
                    color: 'grey'
                },
                ok: {
                    label: ok || confirmText,
                    color: color || getColor(type)
                },
                focus: 'cancel'
            })
                .onOk(function () { return resolve(true); })
                .onCancel(function () { return resolve(false); })
                .onDismiss(function () { return resolve(false); });
        });
    };
    /**
     * Shorthand for warning confirmation
     */
    var confirmWarning = function (message, title) {
        return confirm({
            title: title || 'Cảnh báo',
            message: message,
            type: 'warning'
        });
    };
    /**
     * Shorthand for delete confirmation with danger styling
     */
    var confirmDelete = function (options) {
        var config = typeof options === 'string'
            ? { itemName: options }
            : options;
        var _a = config.title, title = _a === void 0 ? 'Xác nhận xóa' : _a, message = config.message, itemName = config.itemName, _b = config.confirmText, confirmText = _b === void 0 ? 'Xóa' : _b, _c = config.cancelText, cancelText = _c === void 0 ? 'Hủy' : _c;
        var finalMessage = message || "B\u1EA1n c\u00F3 ch\u1EAFc ch\u1EAFn mu\u1ED1n x\u00F3a \"".concat(itemName, "\"? H\u00E0nh \u0111\u1ED9ng n\u00E0y kh\u00F4ng th\u1EC3 ho\u00E0n t\u00E1c.");
        return new Promise(function (resolve) {
            $q.dialog({
                title: title,
                message: finalMessage,
                html: true,
                persistent: true,
                cancel: {
                    label: cancelText,
                    flat: true,
                    color: 'grey'
                },
                ok: {
                    label: confirmText,
                    color: 'negative'
                },
                focus: 'cancel'
            })
                .onOk(function () { return resolve(true); })
                .onCancel(function () { return resolve(false); })
                .onDismiss(function () { return resolve(false); });
        });
    };
    return {
        confirm: confirm,
        confirmWarning: confirmWarning,
        confirmDelete: confirmDelete
    };
}
