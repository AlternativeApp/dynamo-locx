"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const long_1 = __importDefault(require("long"));
const ava_1 = __importDefault(require("ava"));
const geohash_range_js_1 = require("../../model/geohash-range.js");
const range = new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000000000000'), long_1.default.fromString('1000000000010000000'));
(0, ava_1.default)('returns the same range when nothing needs splitting', (t) => {
    t.deepEqual(range.trySplit(1), [range]);
    t.deepEqual(range.trySplit(3), [range]);
    t.deepEqual(range.trySplit(4), [range]);
    t.deepEqual(range.trySplit(5), [range]);
    t.deepEqual(range.trySplit(6), [range]);
    t.deepEqual(range.trySplit(7), [range]);
    t.deepEqual(range.trySplit(8), [range]);
    t.deepEqual(range.trySplit(9), [range]);
    t.deepEqual(range.trySplit(10), [range]);
    t.deepEqual(range.trySplit(11), [range]);
});
(0, ava_1.default)('splits correctly on the given digit', (t) => {
    t.deepEqual(range.trySplit(12), [
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000000000000'), long_1.default.fromString('1000000000009999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000010000000'), long_1.default.fromString('1000000000010000000')),
    ]);
    t.deepEqual(range.trySplit(13), [
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000000000000'), long_1.default.fromString('1000000000000999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000001000000'), long_1.default.fromString('1000000000001999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000002000000'), long_1.default.fromString('1000000000002999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000003000000'), long_1.default.fromString('1000000000003999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000004000000'), long_1.default.fromString('1000000000004999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000005000000'), long_1.default.fromString('1000000000005999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000006000000'), long_1.default.fromString('1000000000006999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000007000000'), long_1.default.fromString('1000000000007999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000008000000'), long_1.default.fromString('1000000000008999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000009000000'), long_1.default.fromString('1000000000009999999')),
        new geohash_range_js_1.GeohashRange(long_1.default.fromString('1000000000010000000'), long_1.default.fromString('1000000000010000000')),
    ]);
});
