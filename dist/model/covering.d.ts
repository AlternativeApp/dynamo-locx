import type { S2CellId } from 'nodes2ts';
import { GeohashRange } from './geohash-range.js';
export declare class Covering {
    private readonly cellIds;
    constructor(cellIds: S2CellId[]);
    getGeoHashRanges(hashKeyLength: number): GeohashRange[];
    getNumberOfCells(): number;
}
