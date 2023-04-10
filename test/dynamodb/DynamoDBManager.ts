import { DynamoDBManager } from "../../src/dynamodb/DynamoDBManager";
import { GeoDataManagerConfiguration } from "../../src";
import ava from "ava";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

ava(
  "DynamoDBManager.deletePoint calls deleteItem with the correct arguments ",
  (t) => {
    let called = false;
    const config = new GeoDataManagerConfiguration(
      {
        deleteItem: (args: any) => {
          called = true;
          t.deepEqual(args, {
            TableName: "MyTable",
            Key: {
              hashKey: { N: "44" },
              rangeKey: { S: "1234" },
            },
          });
        },
      } as any as DynamoDBClient,
      "MyTable"
    );

    const ddb = new DynamoDBManager(config);

    ddb.deletePoint({
      RangeKeyValue: { S: "1234" },
      GeoPoint: {
        longitude: 50,
        latitude: 1,
      },
    });

    t.is(called, true);
  }
);

ava(
  "DynamoDBManager.putPoint calls putItem with the correct arguments ",
  (t) => {
    let called = false;
    const config = new GeoDataManagerConfiguration(
      {
        putItem: (args: any) => {
          called = true;
          t.deepEqual(args, {
            TableName: "MyTable",
            Item: {
              geoJson: { S: '{"type":"Point","coordinates":[-0.13,51.51]}' },
              geohash: { N: "5221366118452580119" },
              hashKey: { N: "52" },
              rangeKey: { S: "1234" },
              country: { S: "UK" },
              capital: { S: "London" },
            },
            ConditionExpression: "attribute_not_exists(capital)",
          });
        },
      } as any as DynamoDBClient,
      "MyTable"
    );

    const ddb: any = new DynamoDBManager(config);

    ddb.putPoint({
      RangeKeyValue: { S: "1234" }, // Use this to ensure uniqueness of the hash/range pairs.
      GeoPoint: {
        // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
        latitude: 51.51,
        longitude: -0.13,
      },
      PutItemInput: {
        // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
        Item: {
          // The primary key, geohash and geojson data is filled in for you
          country: { S: "UK" }, // Specify attribute values using { type: value } objects, like the DynamoDB API.
          capital: { S: "London" },
        },
        ConditionExpression: "attribute_not_exists(capital)",
      },
    });

    t.is(called, true);
  }
);
