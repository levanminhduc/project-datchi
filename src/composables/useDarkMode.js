"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDarkMode = useDarkMode;
var quasar_1 = require("quasar");
var vue_1 = require("vue");
function useDarkMode() {
    var $q = (0, quasar_1.useQuasar)();
    var preference = (0, vue_1.ref)(localStorage.getItem('quasar-dark-mode') || 'auto');
    var applyMode = function (mode) {
        if (mode === 'auto') {
            $q.dark.set('auto');
        }
        else {
            $q.dark.set(mode === 'dark');
        }
    };
    var setMode = function (mode) {
        preference.value = mode;
        localStorage.setItem('quasar-dark-mode', mode);
        applyMode(mode);
    };
    var toggle = function () {
        if (preference.value === 'light') {
            setMode('dark');
        }
        else if (preference.value === 'dark') {
            setMode('auto');
        }
        else {
            setMode('light');
        }
    };
    var isDark = function () { return $q.dark.isActive; };
    var init = function () {
        applyMode(preference.value);
    };
    return {
        preference: preference,
        setMode: setMode,
        toggle: toggle,
        isDark: isDark,
        init: init
    };
}
