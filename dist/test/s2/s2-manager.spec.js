"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const long_1 = __importDefault(require("long"));
const ava_1 = __importDefault(require("ava"));
const s2_manager_js_1 = require("../../s2/s2-manager.js");
(0, ava_1.default)('generateGeoHash', (t) => {
    t.is((0, s2_manager_js_1.generateGeohash)({
        latitude: 52.1,
        longitude: 2,
    }).toString(10), '5177531549489041509');
});
(0, ava_1.default)('generateHashKey', (t) => {
    t.is((0, s2_manager_js_1.generateHashKey)(long_1.default.fromString('5177531549489041509', false, 10), 6).toNumber(), 517753);
});
