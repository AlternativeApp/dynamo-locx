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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const index_js_1 = __importDefault(require("../../index.js"));
const capitals_js_1 = __importDefault(require("./capitals.js"));
// Use a local DB for the example.
const ddb = new client_dynamodb_1.DynamoDBClient({
    endpoint: 'http://127.0.0.1:8000',
    region: 'us-east-1',
});
// Configuration for a new instance of a GeoDataManager. Each GeoDataManager instance represents a table
const locx = new index_js_1.default({
    client: ddb,
    tableName: 'GeoTableExample',
    hashKeyLength: 3,
    consistentRead: true,
});
ava_1.default.beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    // Use GeoTableUtil to help construct a CreateTableInput.
    const createTableInput = locx.getCreateTableRequest({
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    });
    yield ddb.send(new client_dynamodb_1.CreateTableCommand(createTableInput));
    // Wait for it to become ready
    yield (0, client_dynamodb_1.waitUntilTableExists)({ client: ddb, maxWaitTime: 30 }, { TableName: locx.tableName });
    // Load sample data in batches
    console.log('Loading sample data from capitals.json');
    const putPointInputs = capitals_js_1.default.map(function (capital, i) {
        return {
            RangeKeyValue: { S: String(i) },
            GeoPoint: {
                latitude: capital.latitude,
                longitude: capital.longitude,
            },
            PutItemCommandInput: {
                Item: {
                    country: { S: capital.country },
                    capital: { S: capital.capital },
                },
            },
        };
    });
    const BATCH_SIZE = 25;
    const WAIT_BETWEEN_BATCHES_MS = 1000;
    let currentBatch = 1;
    while (putPointInputs.length > 0) {
        const thisBatch = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            const itemToAdd = putPointInputs.shift();
            if (!itemToAdd) {
                break;
            }
            thisBatch.push(itemToAdd);
        }
        console.log(`Writing batch ${currentBatch++}/${Math.ceil(capitals_js_1.default.length / BATCH_SIZE)}`);
        // eslint-disable-next-line no-await-in-loop
        yield locx.batchWritePoints(thisBatch);
        // eslint-disable-next-line no-await-in-loop
        yield new Promise((resolve) => {
            setTimeout(resolve, WAIT_BETWEEN_BATCHES_MS);
        });
    }
}));
(0, ava_1.default)('queryRadius', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.teardown(teardown);
    // Perform a radius query
    const result = yield locx.queryRadius({
        RadiusInMeter: 100000,
        CenterPoint: {
            latitude: 52.22573,
            longitude: 0.149593,
        },
    });
    t.deepEqual(result, [
        {
            rangeKey: { S: '50' },
            country: { S: 'United Kingdom' },
            capital: { S: 'London' },
            hashKey: { N: '522' },
            geoJson: { S: '{"type":"Point","coordinates":[-0.13,51.51]}' },
            geohash: { N: '5221366118452580119' },
        },
    ]);
}));
const teardown = () => __awaiter(void 0, void 0, void 0, function* () {
    yield ddb.send(new client_dynamodb_1.DeleteTableCommand({ TableName: locx.tableName }));
});
