"use strict";
/**
 * Validation Rules
 * Compatible với Quasar input rules API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateRules = void 0;
/**
 * Validate format DD/MM/YYYY
 */
var formatRule = function (val) {
    if (!val)
        return true;
    return /^\d{2}\/\d{2}\/\d{4}$/.test(val) || 'Định dạng phải là DD/MM/YYYY';
};
/**
 * Validate ngày thực sự tồn tại (không 30/02, 31/04, etc.)
 */
var validRule = function (val) {
    if (!val)
        return true;
    var parts = val.split('/');
    if (parts.length !== 3)
        return 'Ngày không hợp lệ';
    var d = Number(parts[0]);
    var m = Number(parts[1]);
    var y = Number(parts[2]);
    if (isNaN(d) || isNaN(m) || isNaN(y))
        return 'Ngày không hợp lệ';
    var date = new Date(y, m - 1, d);
    var isValid = date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d;
    return isValid || 'Ngày không hợp lệ';
};
/**
 * Combined rule: format + valid
 */
var dateRule = function (val) {
    if (!val)
        return true;
    var formatCheck = formatRule(val);
    if (formatCheck !== true)
        return formatCheck;
    return validRule(val);
};
exports.dateRules = {
    format: formatRule,
    valid: validRule,
    date: dateRule
};
