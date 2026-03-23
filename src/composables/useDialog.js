"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDialog = useDialog;
var vue_1 = require("vue");
function useDialog(defaultValue) {
    var isOpen = (0, vue_1.ref)(false);
    var data = (0, vue_1.ref)(defaultValue);
    var open = function (payload) {
        data.value = payload;
        isOpen.value = true;
    };
    var close = function () {
        isOpen.value = false;
        data.value = defaultValue;
    };
    var toggle = function () {
        isOpen.value = !isOpen.value;
    };
    return {
        isOpen: isOpen,
        data: data,
        open: open,
        close: close,
        toggle: toggle
    };
}
