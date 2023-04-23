import { S2LatLngRect } from 'nodes2ts';
import { type QueryRadiusInput, type QueryRectangleInput } from '../types';
export declare const latLngRectFromQueryRectangleInput: (geoQueryRequest: QueryRectangleInput) => S2LatLngRect;
export declare const getBoundingLatLngRectFromQueryRadiusInput: (geoQueryRequest: QueryRadiusInput) => S2LatLngRect;
