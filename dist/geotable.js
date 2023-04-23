"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoTable = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const nodes2ts_1 = require("nodes2ts");
const covering_js_1 = require("./model/covering.js");
const s2_manager_js_1 = require("./s2/s2-manager.js");
const s2_utils_js_1 = require("./s2/s2-utils.js");
class GeoTable {
    constructor(config) {
        this.tableName = config.tableName;
        this.client = config.client;
        this.consistentRead = config.consistentRead ?? false;
        this.hashKeyAttributeName = config.hashKeyAttributeName ?? 'hashKey';
        this.rangeKeyAttributeName = config.rangeKeyAttributeName ?? 'rangeKey';
        this.geohashAttributeName = config.geohashAttributeName ?? 'geohash';
        this.geoJsonAttributeName = config.geoJsonAttributeName ?? 'geoJson';
        this.geohashIndexName = config.geohashIndexName ?? 'geohash-index';
        this.hashKeyLength = config.hashKeyLength ?? 2;
        this.longitudeFirst = config.longitudeFirst ?? true;
        this.geoJsonPointType = config.geoJsonPointType ?? 'Point';
    }
    /**
     * Query the table by geohash for a given range of geohashes
     */
    async queryGeohash(queryInput, hashKey, range) {
        const queryOutputs = [];
        const nextQuery = async (lastEvaluatedKey) => {
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
            const queryOutput = await this.client.send(new client_dynamodb_1.QueryCommand({
                ...defaults,
                ...queryInput,
            }));
            queryOutputs.push(queryOutput);
            if (queryOutput.LastEvaluatedKey) {
                return nextQuery(queryOutput.LastEvaluatedKey);
            }
            return queryOutputs;
        };
        await nextQuery();
        return queryOutputs;
    }
    /**
     * Get a point from the table
     */
    async getPoint(getPointInput) {
        const geohash = (0, s2_manager_js_1.generateGeohash)(getPointInput.GeoPoint);
        const hashKey = (0, s2_manager_js_1.generateHashKey)(geohash, this.hashKeyLength);
        const getItemInput = {
            ...getPointInput.GetItemCommandInput,
            TableName: this.tableName,
        };
        getItemInput.Key = {
            [this.hashKeyAttributeName]: { N: hashKey.toString(10) },
            [this.rangeKeyAttributeName]: getPointInput.RangeKeyValue,
        };
        return this.client.send(new client_dynamodb_1.GetItemCommand(getItemInput));
    }
    /**
     * Put a point into the table
     */
    async putPoint(putPointInput) {
        const geohash = (0, s2_manager_js_1.generateGeohash)(putPointInput.GeoPoint);
        const hashKey = (0, s2_manager_js_1.generateHashKey)(geohash, this.hashKeyLength);
        const putItemInput = {
            ...putPointInput.PutItemCommandInput,
            TableName: this.tableName,
        };
        const item = putPointInput.PutItemCommandInput.Item ?? {};
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
    }
    /**
     * Batch write points into the table
     */
    async batchWritePoints(putPointInputs) {
        const writeInputs = [];
        for (const putPointInput of putPointInputs) {
            const geohash = (0, s2_manager_js_1.generateGeohash)(putPointInput.GeoPoint);
            const hashKey = (0, s2_manager_js_1.generateHashKey)(geohash, this.hashKeyLength);
            const putItemInput = putPointInput.PutItemCommandInput;
            const putRequest = {
                ...putItemInput,
                TableName: this.tableName,
                Item: putItemInput.Item ?? {},
            };
            const item = putItemInput.Item ?? {};
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
    }
    /**
     * Update a point in the table
     */
    async updatePoint(updatePointInput) {
        const geohash = (0, s2_manager_js_1.generateGeohash)(updatePointInput.GeoPoint);
        const hashKey = (0, s2_manager_js_1.generateHashKey)(geohash, this.hashKeyLength);
        const updateItemInput = {
            ...updatePointInput.UpdateItemCommandInput,
            TableName: this.tableName,
            Key: {},
        };
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
    }
    /**
     * Delete a point from the table
     */
    async deletePoint(deletePointInput) {
        const geohash = (0, s2_manager_js_1.generateGeohash)(deletePointInput.GeoPoint);
        const hashKey = (0, s2_manager_js_1.generateHashKey)(geohash, this.hashKeyLength);
        return this.client.send(new client_dynamodb_1.DeleteItemCommand({
            ...deletePointInput.DeleteItemCommandInput,
            TableName: this.tableName,
            Key: {
                [this.hashKeyAttributeName]: { N: hashKey.toString(10) },
                [this.rangeKeyAttributeName]: deletePointInput.RangeKeyValue,
            },
        }));
    }
    /**
     * Query a rectangular area constructed by two points and return all points within the area. Two points need to
     * construct a rectangle from minimum and maximum latitudes and longitudes. If minPoint.getLongitude() >
     * maxPoint.getLongitude(), the rectangle spans the 180 degree longitude line.
     */
    async queryRectangle(queryRectangleInput) {
        const latLngRect = (0, s2_utils_js_1.latLngRectFromQueryRectangleInput)(queryRectangleInput);
        const covering = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells(latLngRect));
        const results = await this.dispatchQueries(covering, queryRectangleInput);
        return this.filterByRectangle(results, queryRectangleInput);
    }
    /**
     * Query a circular area constructed by a center point and its radius.
     */
    async queryRadius(queryRadiusInput) {
        const latLngRect = (0, s2_utils_js_1.getBoundingLatLngRectFromQueryRadiusInput)(queryRadiusInput);
        const covering = new covering_js_1.Covering(new nodes2ts_1.S2RegionCoverer().getCoveringCells(latLngRect));
        const results = await this.dispatchQueries(covering, queryRadiusInput);
        return this.filterByRadius(results, queryRadiusInput);
    }
    /**
     * Construct a create table request object based on GeoDataManagerConfiguration. The users can update any aspect of
     * the request and call it.
     */
    getCreateTableRequest(createTableInput) {
        return {
            ...createTableInput,
            TableName: this.tableName,
            KeySchema: [
                {
                    KeyType: 'HASH',
                    AttributeName: this.hashKeyAttributeName,
                },
                {
                    KeyType: 'RANGE',
                    AttributeName: this.rangeKeyAttributeName,
                },
            ],
            AttributeDefinitions: [
                ...(createTableInput?.AttributeDefinitions ?? []),
                { AttributeName: this.hashKeyAttributeName, AttributeType: 'N' },
                { AttributeName: this.rangeKeyAttributeName, AttributeType: 'S' },
                { AttributeName: this.geohashAttributeName, AttributeType: 'N' },
            ],
            LocalSecondaryIndexes: [
                ...(createTableInput?.LocalSecondaryIndexes ?? []),
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
            ],
        };
    }
    /**
     * Query Amazon DynamoDB in parallel and filter the result.
     */
    async dispatchQueries(covering, geoQueryInput) {
        const promises = covering
            .getGeoHashRanges(this.hashKeyLength)
            .map(async (range) => {
            const hashKey = (0, s2_manager_js_1.generateHashKey)(range.rangeMin, this.hashKeyLength);
            return this.queryGeohash(geoQueryInput.QueryCommandInput, hashKey, range);
        });
        const results = await Promise.all(promises);
        const mergedResults = [];
        for (const queryOutputs of results)
            for (const queryOutput of queryOutputs)
                mergedResults.push(...(queryOutput.Items ?? []));
        return mergedResults;
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
            const geoJson = item[this.geoJsonAttributeName].S ?? '';
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
        const latLngRect = (0, s2_utils_js_1.latLngRectFromQueryRectangleInput)(geoQueryInput);
        return list.filter((item) => {
            const geoJson = item[this.geoJsonAttributeName].S ?? '';
            const coordinates = JSON.parse(geoJson).coordinates;
            const longitude = coordinates[this.longitudeFirst ? 0 : 1];
            const latitude = coordinates[this.longitudeFirst ? 1 : 0];
            const latLng = nodes2ts_1.S2LatLng.fromDegrees(latitude, longitude);
            return latLngRect.containsLL(latLng);
        });
    }
}
exports.GeoTable = GeoTable;
