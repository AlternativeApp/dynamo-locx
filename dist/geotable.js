"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoTable = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const nodes2ts_1 = require("nodes2ts");
const covering_1 = require("./model/covering");
const s2_manager_1 = require("./s2/s2-manager");
const s2_utils_1 = require("./s2/s2-utils");
class GeoTable {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.tableName = config.tableName;
        this.client = config.client;
        this.consistentRead = (_a = config.consistentRead) !== null && _a !== void 0 ? _a : false;
        this.hashKeyAttributeName = (_b = config.hashKeyAttributeName) !== null && _b !== void 0 ? _b : 'hashKey';
        this.rangeKeyAttributeName = (_c = config.rangeKeyAttributeName) !== null && _c !== void 0 ? _c : 'rangeKey';
        this.geohashAttributeName = (_d = config.geohashAttributeName) !== null && _d !== void 0 ? _d : 'geohash';
        this.geoJsonAttributeName = (_e = config.geoJsonAttributeName) !== null && _e !== void 0 ? _e : 'geoJson';
        this.geohashIndexName = (_f = config.geohashIndexName) !== null && _f !== void 0 ? _f : 'geohash-index';
        this.hashKeyLength = (_g = config.hashKeyLength) !== null && _g !== void 0 ? _g : 2;
        this.longitudeFirst = (_h = config.longitudeFirst) !== null && _h !== void 0 ? _h : true;
        this.geoJsonPointType = (_j = config.geoJsonPointType) !== null && _j !== void 0 ? _j : 'Point';
    }
    /**
     * Query the table by geohash for a given range of geohashes
     */
    queryGeohash(queryInput, hashKey, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryOutputs = [];
            const nextQuery = (lastEvaluatedKey) => __awaiter(this, void 0, void 0, function* () {
                const keyConditions = {};
                keyConditions[this.hashKeyAttributeName] = {
                    ComparisonOperator: 'EQ',
                    AttributeValueList: [{ N: hashKey.toString(10) }],
                };
                const minRange = {
                    N: range.rangeMin.toString(10),
                };
                const maxRange = {
                    N: range.rangeMax.toString(10),
                };
                keyConditions[this.geohashAttributeName] = {
                    ComparisonOperator: 'BETWEEN',
                    AttributeValueList: [minRange, maxRange],
                };
                const defaults = {
                    TableName: this.tableName,
                    KeyConditions: keyConditions,
                    IndexName: this.geohashIndexName,
                    ConsistentRead: this.consistentRead,
                    ReturnConsumedCapacity: 'TOTAL',
                    ExclusiveStartKey: lastEvaluatedKey,
                };
                const queryOutput = yield this.client.send(new client_dynamodb_1.QueryCommand(Object.assign(Object.assign({}, defaults), queryInput)));
                queryOutputs.push(queryOutput);
                if (queryOutput.LastEvaluatedKey) {
                    return nextQuery(queryOutput.LastEvaluatedKey);
                }
                return queryOutputs;
            });
            yield nextQuery();
            return queryOutputs;
        });
    }
    /**
     * Get a point from the table
     */
    getPoint(getPointInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const geohash = (0, s2_manager_1.generateGeohash)(getPointInput.GeoPoint);
            const hashKey = (0, s2_manager_1.generateHashKey)(geohash, this.hashKeyLength);
            const getItemInput = Object.assign(Object.assign({}, getPointInput.GetItemCommandInput), { TableName: this.tableName });
            getItemInput.Key = {
                [this.hashKeyAttributeName]: { N: hashKey.toString(10) },
                [this.rangeKeyAttributeName]: getPointInput.RangeKeyValue,
            };
            return this.client.send(new client_dynamodb_1.GetItemCommand(getItemInput));
        });
    }
    /**
     * Put a point into the table
     */
    putPoint(putPointInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const geohash = (0, s2_manager_1.generateGeohash)(putPointInput.GeoPoint);
            const hashKey = (0, s2_manager_1.generateHashKey)(geohash, this.hashKeyLength);
            const putItemInput = Object.assign(Object.assign({}, putPointInput.PutItemCommandInput), { TableName: this.tableName });
            const item = (_a = putPointInput.PutItemCommandInput.Item) !== null && _a !== void 0 ? _a : {};
            item[this.hashKeyAttributeName] = {
                N: hashKey.toString(10),
            };
            item[this.rangeKeyAttributeName] = putPointInput.RangeKeyValue;
            item[this.geohashAttributeName] = {
                N: geohash.toString(10),
            };
            item[this.geoJsonAttributeName] = {
                S: JSON.stringify({
                    type: this.geoJsonPointType,
                    coordinates: this.longitudeFirst
                        ? [putPointInput.GeoPoint.longitude, putPointInput.GeoPoint.latitude]
                        : [putPointInput.GeoPoint.latitude, putPointInput.GeoPoint.longitude],
                }),
            };
            putItemInput.Item = item;
            return this.client.send(new client_dynamodb_1.PutItemCommand(putItemInput));
        });
    }
    /**
     * Batch write points into the table
     */
    batchWritePoints(putPointInputs) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const writeInputs = [];
            for (const putPointInput of putPointInputs) {
                const geohash = (0, s2_manager_1.generateGeohash)(putPointInput.GeoPoint);
                const hashKey = (0, s2_manager_1.generateHashKey)(geohash, this.hashKeyLength);
                const putItemInput = putPointInput.PutItemCommandInput;
                const putRequest = Object.assign(Object.assign({}, putItemInput), { TableName: this.tableName, Item: (_a = putItemInput.Item) !== null && _a !== void 0 ? _a : {} });
                const item = (_b = putItemInput.Item) !== null && _b !== void 0 ? _b : {};
                item[this.hashKeyAttributeName] = {
                    N: hashKey.toString(10),
                };
                item[this.rangeKeyAttributeName] = putPointInput.RangeKeyValue;
                item[this.geohashAttributeName] = {
                    N: geohash.toString(10),
                };
                item[this.geoJsonAttributeName] = {
                    S: JSON.stringify({
                        type: this.geoJsonPointType,
                        coordinates: this.longitudeFirst
                            ? [
                                putPointInput.GeoPoint.longitude,
                                putPointInput.GeoPoint.latitude,
                            ]
                            : [
                                putPointInput.GeoPoint.latitude,
                                putPointInput.GeoPoint.longitude,
                            ],
                    }),
                };
                putRequest.Item = item;
                writeInputs.push({ PutRequest: putRequest });
            }
            return this.client.send(new client_dynamodb_1.BatchWriteItemCommand({
                RequestItems: {
                    [this.tableName]: writeInputs,
                },
            }));
        });
    }
    /**
     * Update a point in the table
     */
    updatePoint(updatePointInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const geohash = (0, s2_manager_1.generateGeohash)(updatePointInput.GeoPoint);
            const hashKey = (0, s2_manager_1.generateHashKey)(geohash, this.hashKeyLength);
            const updateItemInput = Object.assign(Object.assign({}, updatePointInput.UpdateItemCommandInput), { TableName: this.tableName, Key: {} });
            updateItemInput.Key[this.hashKeyAttributeName] = {
                N: hashKey.toString(10),
            };
            updateItemInput.Key[this.rangeKeyAttributeName] =
                updatePointInput.RangeKeyValue;
            // Geohash and geoJson cannot be updated.
            if (updateItemInput.AttributeUpdates) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete updateItemInput.AttributeUpdates[this.geohashAttributeName];
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete updateItemInput.AttributeUpdates[this.geoJsonAttributeName];
            }
            return this.client.send(new client_dynamodb_1.UpdateItemCommand(updateItemInput));
        });
    }
    /**
     * Delete a point from the table
     */
    deletePoint(deletePointInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const geohash = (0, s2_manager_1.generateGeohash)(deletePointInput.GeoPoint);
            const hashKey = (0, s2_manager_1.generateHashKey)(geohash, this.hashKeyLength);
            return this.client.send(new client_dynamodb_1.DeleteItemCommand(Object.assign(Object.assign({}, deletePointInput.DeleteItemCommandInput), { TableName: this.tableName, Key: {
                    [this.hashKeyAttributeName]: { N: hashKey.toString(10) },
                    [this.rangeKeyAttributeName]: deletePointInput.RangeKeyValue,
                } })));
        });
    }
    /**
     * Query a rectangular area constructed by two points and return all points within the area. Two points need to
     * construct a rectangle from minimum and maximum latitudes and longitudes. If minPoint.getLongitude() >
     * maxPoint.getLongitude(), the rectangle spans the 180 degree longitude line.
     */
    queryRectangle(queryRectangleInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const latLngRect = (0, s2_utils_1.latLngRectFromQueryRectangleInput)(queryRectangleInput);
            const covering = new covering_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells(latLngRect));
            const results = yield this.dispatchQueries(covering, queryRectangleInput);
            return this.filterByRectangle(results, queryRectangleInput);
        });
    }
    /**
     * Query a circular area constructed by a center point and its radius.
     */
    queryRadius(queryRadiusInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const latLngRect = (0, s2_utils_1.getBoundingLatLngRectFromQueryRadiusInput)(queryRadiusInput);
            const covering = new covering_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells(latLngRect));
            const results = yield this.dispatchQueries(covering, queryRadiusInput);
            return this.filterByRadius(results, queryRadiusInput);
        });
    }
    /**
     * Construct a create table request object based on GeoDataManagerConfiguration. The users can update any aspect of
     * the request and call it.
     */
    getCreateTableRequest(createTableInput) {
        var _a, _b;
        return Object.assign(Object.assign({}, createTableInput), { TableName: this.tableName, KeySchema: [
                {
                    KeyType: 'HASH',
                    AttributeName: this.hashKeyAttributeName,
                },
                {
                    KeyType: 'RANGE',
                    AttributeName: this.rangeKeyAttributeName,
                },
            ], AttributeDefinitions: [
                ...((_a = createTableInput === null || createTableInput === void 0 ? void 0 : createTableInput.AttributeDefinitions) !== null && _a !== void 0 ? _a : []),
                { AttributeName: this.hashKeyAttributeName, AttributeType: 'N' },
                { AttributeName: this.rangeKeyAttributeName, AttributeType: 'S' },
                { AttributeName: this.geohashAttributeName, AttributeType: 'N' },
            ], LocalSecondaryIndexes: [
                ...((_b = createTableInput === null || createTableInput === void 0 ? void 0 : createTableInput.LocalSecondaryIndexes) !== null && _b !== void 0 ? _b : []),
                {
                    IndexName: this.geohashIndexName,
                    KeySchema: [
                        {
                            KeyType: 'HASH',
                            AttributeName: this.hashKeyAttributeName,
                        },
                        {
                            KeyType: 'RANGE',
                            AttributeName: this.geohashAttributeName,
                        },
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
            ] });
    }
    /**
     * Query Amazon DynamoDB in parallel and filter the result.
     */
    dispatchQueries(covering, geoQueryInput) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const promises = covering
                .getGeoHashRanges(this.hashKeyLength)
                .map((range) => __awaiter(this, void 0, void 0, function* () {
                const hashKey = (0, s2_manager_1.generateHashKey)(range.rangeMin, this.hashKeyLength);
                return this.queryGeohash(geoQueryInput.QueryCommandInput, hashKey, range);
            }));
            const results = yield Promise.all(promises);
            const mergedResults = [];
            for (const queryOutputs of results)
                for (const queryOutput of queryOutputs)
                    mergedResults.push(...((_a = queryOutput.Items) !== null && _a !== void 0 ? _a : []));
            return mergedResults;
        });
    }
    /**
     * Filter out any points outside of the queried area from the input list.
     */
    filterByRadius(list, geoQueryInput) {
        let radiusInMeter = 0;
        const centerPoint = geoQueryInput.CenterPoint;
        const centerLatLng = nodes2ts_1.S2LatLng.fromDegrees(centerPoint.latitude, centerPoint.longitude);
        radiusInMeter = geoQueryInput.RadiusInMeter;
        return list.filter((item) => {
            var _a;
            const geoJson = (_a = item[this.geoJsonAttributeName].S) !== null && _a !== void 0 ? _a : '';
            const coordinates = JSON.parse(geoJson).coordinates;
            const longitude = coordinates[this.longitudeFirst ? 0 : 1];
            const latitude = coordinates[this.longitudeFirst ? 1 : 0];
            const latLng = nodes2ts_1.S2LatLng.fromDegrees(latitude, longitude);
            return centerLatLng.getEarthDistance(latLng) <= radiusInMeter;
        });
    }
    /**
     * Filter out any points outside of the queried area from the input list.
     */
    filterByRectangle(list, geoQueryInput) {
        const latLngRect = (0, s2_utils_1.latLngRectFromQueryRectangleInput)(geoQueryInput);
        return list.filter((item) => {
            var _a;
            const geoJson = (_a = item[this.geoJsonAttributeName].S) !== null && _a !== void 0 ? _a : '';
            const coordinates = JSON.parse(geoJson).coordinates;
            const longitude = coordinates[this.longitudeFirst ? 0 : 1];
            const latitude = coordinates[this.longitudeFirst ? 1 : 0];
            const latLng = nodes2ts_1.S2LatLng.fromDegrees(latitude, longitude);
            return latLngRect.containsLL(latLng);
        });
    }
}
exports.GeoTable = GeoTable;
