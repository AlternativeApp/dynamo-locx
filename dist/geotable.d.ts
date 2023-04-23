import { type CreateTableCommandInput, type DynamoDBClient, type QueryCommandInput, type QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import type Long from 'long';
import { type BatchWritePointOutput, type DeletePointInput, type DeletePointOutput, type GetPointInput, type GetPointOutput, type PutPointInput, type PutPointOutput, type UpdatePointInput, type UpdatePointOutput, type GeoQueryInput, type QueryRadiusInput, type QueryRectangleInput, type ItemList, type GeoTableConfiguration } from './types.js';
import type { GeohashRange } from './model/geohash-range.js';
import { Covering } from './model/covering.js';
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export declare class GeoTable {
    readonly tableName: string;
    protected client: DynamoDBClient;
    protected consistentRead: boolean;
    protected hashKeyAttributeName: string;
    protected rangeKeyAttributeName: string;
    protected geohashAttributeName: string;
    protected geoJsonAttributeName: string;
    protected geohashIndexName: string;
    protected hashKeyLength: number;
    protected longitudeFirst: boolean;
    protected geoJsonPointType: 'Point' | 'POINT';
    constructor(config: GeoTableConfiguration);
    /**
     * Query the table by geohash for a given range of geohashes
     */
    queryGeohash(queryInput: Omit<QueryCommandInput, 'TableName'> | undefined, hashKey: Long, range: GeohashRange): Promise<QueryCommandOutput[]>;
    /**
     * Get a point from the table
     */
    getPoint(getPointInput: GetPointInput): Promise<GetPointOutput>;
    /**
     * Put a point into the table
     */
    putPoint(putPointInput: PutPointInput): Promise<PutPointOutput>;
    /**
     * Batch write points into the table
     */
    batchWritePoints(putPointInputs: PutPointInput[]): Promise<BatchWritePointOutput>;
    /**
     * Update a point in the table
     */
    updatePoint(updatePointInput: UpdatePointInput): Promise<UpdatePointOutput>;
    /**
     * Delete a point from the table
     */
    deletePoint(deletePointInput: DeletePointInput): Promise<DeletePointOutput>;
    /**
     * Query a rectangular area constructed by two points and return all points within the area. Two points need to
     * construct a rectangle from minimum and maximum latitudes and longitudes. If minPoint.getLongitude() >
     * maxPoint.getLongitude(), the rectangle spans the 180 degree longitude line.
     */
    queryRectangle(queryRectangleInput: QueryRectangleInput): Promise<ItemList>;
    /**
     * Query a circular area constructed by a center point and its radius.
     */
    queryRadius(queryRadiusInput: QueryRadiusInput): Promise<ItemList>;
    /**
     * Construct a create table request object based on GeoDataManagerConfiguration. The users can update any aspect of
     * the request and call it.
     */
    getCreateTableRequest(createTableInput?: PartialBy<Omit<CreateTableCommandInput, 'TableName' | 'KeySchema'>, 'AttributeDefinitions'>): CreateTableCommandInput;
    /**
     * Query Amazon DynamoDB in parallel and filter the result.
     */
    protected dispatchQueries(covering: Covering, geoQueryInput: GeoQueryInput): Promise<ItemList>;
    /**
     * Filter out any points outside of the queried area from the input list.
     */
    protected filterByRadius(list: ItemList, geoQueryInput: QueryRadiusInput): ItemList;
    /**
     * Filter out any points outside of the queried area from the input list.
     */
    protected filterByRectangle(list: ItemList, geoQueryInput: QueryRectangleInput): ItemList;
}
export {};
