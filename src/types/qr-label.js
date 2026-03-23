"use strict";
/**
 * Types for QR Label Printing functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GRID_CONFIG = exports.A4_SIZE = exports.LABEL_SIZE = exports.QR_SIZE_MAP = void 0;
/** QR code size in pixels */
exports.QR_SIZE_MAP = {
    small: 64,
    medium: 96,
    large: 128,
};
/** Standard label size 50x30mm */
exports.LABEL_SIZE = {
    width: 50,
    height: 30,
};
/** A4 paper dimensions in mm */
exports.A4_SIZE = {
    width: 210,
    height: 297,
};
/** Default grid config for A4 paper with 50x30mm labels */
exports.DEFAULT_GRID_CONFIG = {
    columns: 4,
    rows: 9,
    marginTop: 10,
    marginLeft: 5,
    gapX: 2,
    gapY: 2,
};
