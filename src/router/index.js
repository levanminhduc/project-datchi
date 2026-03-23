"use strict";
/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Composables
var vue_router_1 = require("vue-router");
var auto_routes_1 = require("vue-router/auto-routes");
var guards_1 = require("./guards");
var router = (0, vue_router_1.createRouter)({
    history: (0, vue_router_1.createWebHistory)(import.meta.env.BASE_URL),
    routes: auto_routes_1.routes,
    scrollBehavior: function (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',
            };
        }
        return { top: 0, left: 0, behavior: 'smooth' };
    },
});
// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError(function (err, to) {
    var _a, _b;
    if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes) === null || _b === void 0 ? void 0 : _b.call(_a, 'Failed to fetch dynamically imported module')) {
        if (localStorage.getItem('quasar:dynamic-reload')) {
            console.error('Dynamic import error, reloading page did not fix it', err);
        }
        else {
            console.log('Reloading page to fix dynamic import error');
            localStorage.setItem('quasar:dynamic-reload', 'true');
            location.assign(to.fullPath);
        }
    }
    else {
        console.error(err);
    }
});
router.isReady().then(function () {
    localStorage.removeItem('quasar:dynamic-reload');
});
// Setup authentication and authorization guards
(0, guards_1.setupRouterGuards)(router);
exports.default = router;
