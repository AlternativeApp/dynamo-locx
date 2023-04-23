"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Covering = void 0;
const geohash_range_js_1 = require("./geohash-range.js");
class Covering {
    constructor(cellIds) {
        this.cellIds = cellIds;
        this.cellIds = cellIds;
    }
    getGeoHashRanges(hashKeyLength) {
        const ranges = [];
        for (const outerRange of this.cellIds) {
            const hashRange = new geohash_range_js_1.GeohashRange(outerRange.rangeMin().id, outerRange.rangeMax().id);
            ranges.push(...hashRange.trySplit(hashKeyLength));
        }
        return ranges;
    }
    getNumberOfCells() {
        return this.cellIds.length;
    }
}
exports.Covering = Covering;
