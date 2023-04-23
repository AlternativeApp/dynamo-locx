"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const index_js_1 = __importDefault(require("../../index.js"));
(0, ava_1.default)('DynamoDBManager.deletePoint calls deleteItem with the correct arguments ', async (t) => {
    let called = false;
    const locx = new index_js_1.default({
        client: {
            send(args) {
                called = true;
                t.deepEqual(args.input, {
                    TableName: 'MyTable',
                    Key: {
                        hashKey: { N: '44' },
                        rangeKey: { S: '1234' },
                    },
                });
            },
        },
        tableName: 'MyTable',
    });
    await locx.deletePoint({
        RangeKeyValue: { S: '1234' },
        GeoPoint: {
            longitude: 50,
            latitude: 1,
        },
    });
    t.is(called, true);
});
(0, ava_1.default)('DynamoDBManager.putPoint calls putItem with the correct arguments ', async (t) => {
    let called = false;
    const locx = new index_js_1.default({
        client: {
            send(args) {
                called = true;
                t.deepEqual(args.input, {
                    TableName: 'MyTable',
                    Item: {
                        geoJson: { S: '{"type":"Point","coordinates":[-0.13,51.51]}' },
                        geohash: { N: '5221366118452580119' },
                        hashKey: { N: '52' },
                        rangeKey: { S: '1234' },
                        country: { S: 'UK' },
                        capital: { S: 'London' },
                    },
                    ConditionExpression: 'attribute_not_exists(capital)',
                });
            },
        },
        tableName: 'MyTable',
    });
    await locx.putPoint({
        RangeKeyValue: { S: '1234' },
        GeoPoint: {
            // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
            latitude: 51.51,
            longitude: -0.13,
        },
        PutItemCommandInput: {
            // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
            Item: {
                // The primary key, geohash and geojson data is filled in for you
                country: { S: 'UK' },
                capital: { S: 'London' },
            },
            ConditionExpression: 'attribute_not_exists(capital)',
        },
    });
    t.is(called, true);
});
