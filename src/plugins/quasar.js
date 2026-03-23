"use strict";
/**
 * plugins/quasar.ts
 *
 * Framework documentation: https://quasar.dev
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quasarConfig = void 0;
// Quasar (CSS is imported in main.ts to avoid duplicates)
var quasar_1 = require("quasar");
exports.default = quasar_1.Quasar;
exports.quasarConfig = {
    plugins: {
        Dialog: quasar_1.Dialog,
        Notify: quasar_1.Notify,
        Loading: quasar_1.Loading,
        BottomSheet: quasar_1.BottomSheet,
    },
    directives: {
        ClosePopup: quasar_1.ClosePopup,
        Ripple: quasar_1.Ripple,
    },
    config: {
        dark: 'auto',
    },
};
