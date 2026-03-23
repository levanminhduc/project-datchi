"use strict";
/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = registerPlugins;
// Plugins
var quasar_1 = require("quasar");
var pinia_1 = require("pinia");
var quasar_2 = require("./quasar");
var router_1 = require("../router");
// Create Pinia instance
var pinia = (0, pinia_1.createPinia)();
function registerPlugins(app) {
    app
        .use(pinia)
        .use(quasar_1.Quasar, quasar_2.quasarConfig)
        .use(router_1.default);
}
