"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeohashRange = void 0;
const long_1 = __importDefault(require("long"));
const s2_manager_1 = require("../s2/s2-manager");
const MERGE_THRESHOLD = 2;
class GeohashRange {
    constructor(min, max) {
        this.rangeMin = long_1.default.isLong(min) ? min : long_1.default.fromNumber(min);
        this.rangeMax = long_1.default.isLong(max) ? max : long_1.default.fromNumber(max);
    }
    tryMerge(range) {
        if (range.rangeMin.subtract(this.rangeMax).lessThanOrEqual(MERGE_THRESHOLD) &&
            range.rangeMin.greaterThan(this.rangeMax)) {
            this.rangeMax = range.rangeMax;
            return true;
        }
        if (this.rangeMin.subtract(range.rangeMax).lessThanOrEqual(MERGE_THRESHOLD) &&
            this.rangeMin.greaterThan(range.rangeMax)) {
            this.rangeMin = range.rangeMin;
            return true;
        }
        return false;
    }
    /*
     * Try to split the range to multiple ranges based on the hash key.
     *
     * e.g., for the following range:
     *
     * min: 123456789
     * max: 125678912
     *
     * when the hash key length is 3, we want to split the range to:
     *
     * 1
     * min: 123456789
     * max: 123999999
     *
     * 2
     * min: 124000000
     * max: 124999999
     *
     * 3
     * min: 125000000
     * max: 125678912
     *
     * For this range:
     *
     * min: -125678912
     * max: -123456789
     *
     * we want:
     *
     * 1
     * min: -125678912
     * max: -125000000
     *
     * 2
     * min: -124999999
     * max: -124000000
     *
     * 3
     * min: -123999999
     * max: -123456789
     */
    trySplit(hashKeyLength) {
        const result = [];
        const minHashKey = (0, s2_manager_1.generateHashKey)(this.rangeMin, hashKeyLength);
        const maxHashKey = (0, s2_manager_1.generateHashKey)(this.rangeMax, hashKeyLength);
        const denominator = Math.pow(10, (this.rangeMin.toString().length - minHashKey.toString().length));
        if (minHashKey.equals(maxHashKey)) {
            result.push(this);
        }
        else {
            for (let l = minHashKey; l.lessThanOrEqual(maxHashKey); l = l.add(1)) {
                if (l.greaterThan(0)) {
                    result.push(new GeohashRange(l.equals(minHashKey) ? this.rangeMin : l.multiply(denominator), l.equals(maxHashKey)
                        ? this.rangeMax
                        : l.add(1).multiply(denominator).subtract(1)));
                }
                else {
                    result.push(new GeohashRange(l.equals(minHashKey)
                        ? this.rangeMin
                        : l.subtract(1).multiply(denominator).add(1), l.equals(maxHashKey) ? this.rangeMax : l.multiply(denominator)));
                }
            }
        }
        return result;
    }
}
exports.GeohashRange = GeohashRange;
