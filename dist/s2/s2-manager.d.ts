import type Long from 'long';
import { type GeoPoint } from '../types';
export declare const generateGeohash: (geoPoint: GeoPoint) => Long;
export declare const generateHashKey: (geohash: Long, hashKeyLength: number) => Long;
