"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoundingLatLngRectFromQueryRadiusInput = exports.latLngRectFromQueryRectangleInput = void 0;
const nodes2ts_1 = require("nodes2ts");
const latLngRectFromQueryRectangleInput = (geoQueryRequest) => {
    const queryRectangleRequest = geoQueryRequest;
    const minPoint = queryRectangleRequest.MinPoint;
    const maxPoint = queryRectangleRequest.MaxPoint;
    if (minPoint && maxPoint) {
        const minLatLng = nodes2ts_1.S2LatLng.fromDegrees(minPoint.latitude, minPoint.longitude);
        const maxLatLng = nodes2ts_1.S2LatLng.fromDegrees(maxPoint.latitude, maxPoint.longitude);
        return nodes2ts_1.S2LatLngRect.fromLatLng(minLatLng, maxLatLng);
    }
    throw new Error('Invalid query rectangle input.');
};
exports.latLngRectFromQueryRectangleInput = latLngRectFromQueryRectangleInput;
const getBoundingLatLngRectFromQueryRadiusInput = (geoQueryRequest) => {
    const centerPoint = geoQueryRequest.CenterPoint;
    const radiusInMeter = geoQueryRequest.RadiusInMeter;
    const centerLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude);
    const latReferenceUnit = centerPoint.latitude > 0 ? -1 : 1;
    const latReferenceLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude + latReferenceUnit, centerPoint.longitude);
    const lngReferenceUnit = centerPoint.longitude > 0 ? -1 : 1;
    const lngReferenceLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude + lngReferenceUnit);
    const latForRadius = radiusInMeter / centerLatLng.getEarthDistance(latReferenceLatLng);
    const lngForRadius = radiusInMeter / centerLatLng.getEarthDistance(lngReferenceLatLng);
    const minLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude - latForRadius, centerPoint.longitude - lngForRadius);
    const maxLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude + latForRadius, centerPoint.longitude + lngForRadius);
    return nodes2ts_1.S2LatLngRect.fromLatLng(minLatLng, maxLatLng);
};
exports.getBoundingLatLngRectFromQueryRadiusInput = getBoundingLatLngRectFromQueryRadiusInput;
