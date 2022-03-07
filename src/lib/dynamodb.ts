import {
  AttributeValue,
  DynamoDBClient,
  ScanCommandInput,
  UpdateItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const newDynamoDBClient = (region: string, endpoint?: string) => {
  const client = new DynamoDBClient({ region, maxAttempts: 3, endpoint });
  return DynamoDBDocumentClient.from(client);
};

export type ScanFilterFragment = { key: string; op: string; value: string };

export type ScanFilterOptions = Pick<
  ScanCommandInput,
  'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
>;

export const serializeScanFilter = (
  fragments: ScanFilterFragment[] = [],
): ScanFilterOptions => ({
  FilterExpression: fragments.map(({ key, op }) => `${key} ${op}`).join(' '),
  ExpressionAttributeNames: fragments.reduce(
    (result, { key }) => ({ ...result, [`${key}`]: key }),
    {} as Record<string, string>,
  ),
  ExpressionAttributeValues: fragments.reduce(
    (result, { key, value }) => ({ ...result, [`:${key}`]: { S: value } }),
    {} as Record<string, AttributeValue>,
  ),
});

export type UpdateItemOptions = Pick<
  UpdateItemCommandInput,
  'AttributeUpdates' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'
>;

export const serializeUpdateAttributes = (): UpdateItemOptions => ({
  AttributeUpdates: undefined,
  ExpressionAttributeNames: undefined,
  ExpressionAttributeValues: undefined,
});
