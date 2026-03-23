"use strict";
/**
 * main.ts
 *
 * Bootstraps Quasar and other plugins then mounts the App
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Quasar styles (must be before plugins)
require("@quasar/extras/material-icons/material-icons.css");
require("@quasar/extras/material-icons-outlined/material-icons-outlined.css");
require("quasar/src/css/index.sass");
// Plugins
var plugins_1 = require("@/plugins");
// Components
var App_vue_1 = require("./App.vue");
// Composables
var vue_1 = require("vue");
// Directives
var permission_1 = require("@/directives/permission");
// Styles
require("unfonts.css");
require("./styles/global.scss");
var app = (0, vue_1.createApp)(App_vue_1.default);
(0, plugins_1.registerPlugins)(app);
// Register custom directives
app.directive('permission', permission_1.vPermission);
app.mount('#app');
