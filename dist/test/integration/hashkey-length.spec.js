"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const nodes2ts_1 = require("nodes2ts");
const covering_js_1 = require("../../model/covering.js");
const s2_utils_js_1 = require("../../s2/s2-utils.js");
(0, ava_1.default)('Appropriate hash key lengths, 10m radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 10,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 8);
    t.is(cov.getGeoHashRanges(10).length, 8);
    t.is(cov.getGeoHashRanges(11).length, 8); // Recommend hashKeyLength = 11 for 10m radius searches
    t.is(cov.getGeoHashRanges(12).length, 11);
    t.is(cov.getGeoHashRanges(13).length, 32);
    t.is(cov.getGeoHashRanges(13).length, 32);
});
(0, ava_1.default)('Appropriate hash key lengths, 1km radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 1000,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 8);
    t.is(cov.getGeoHashRanges(6).length, 8);
    t.is(cov.getGeoHashRanges(7).length, 8); // Recommend hashKeyLength = 7 for 1km radius searches
    t.is(cov.getGeoHashRanges(8).length, 10);
    t.is(cov.getGeoHashRanges(9).length, 36);
    t.is(cov.getGeoHashRanges(9).length, 36);
});
(0, ava_1.default)('Appropriate hash key lengths, 10km radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 10000,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 8);
    t.is(cov.getGeoHashRanges(2).length, 8);
    t.is(cov.getGeoHashRanges(3).length, 8);
    t.is(cov.getGeoHashRanges(4).length, 8);
    t.is(cov.getGeoHashRanges(5).length, 8); // Recommend hashKeyLength = 5 for 10km radius searches
    t.is(cov.getGeoHashRanges(6).length, 9);
    t.is(cov.getGeoHashRanges(7).length, 29);
    t.is(cov.getGeoHashRanges(8).length, 216);
});
(0, ava_1.default)('Appropriate hash key lengths, 50km radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 50000,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 6);
    t.is(cov.getGeoHashRanges(2).length, 6);
    t.is(cov.getGeoHashRanges(3).length, 6);
    t.is(cov.getGeoHashRanges(4).length, 6); // Recommend hashKeyLength = 4 for 50km radius searches
    t.is(cov.getGeoHashRanges(5).length, 9);
    t.is(cov.getGeoHashRanges(6).length, 49);
    t.is(cov.getGeoHashRanges(7).length, 428);
});
(0, ava_1.default)('Appropriate hash key lengths, 100km radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 100000,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 8);
    t.is(cov.getGeoHashRanges(2).length, 8);
    t.is(cov.getGeoHashRanges(3).length, 8); // Recommend hashKeyLength = 3 for 100km radius searches
    t.is(cov.getGeoHashRanges(4).length, 11);
    t.is(cov.getGeoHashRanges(5).length, 36);
    t.is(cov.getGeoHashRanges(6).length, 292);
});
(0, ava_1.default)('Appropriate hash key lengths, 1000km radius', (t) => {
    const cov = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells((0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)({
        RadiusInMeter: 1000000,
        CenterPoint: {
            latitude: 59,
            longitude: 0,
        },
    })));
    t.is(cov.getNumberOfCells(), 8);
    t.is(cov.getGeoHashRanges(1).length, 8); // Recommend hashKeyLength = 1 for 1000km radius searches
    t.is(cov.getGeoHashRanges(2).length, 10);
    t.is(cov.getGeoHashRanges(3).length, 35);
    t.is(cov.getGeoHashRanges(4).length, 289);
});
