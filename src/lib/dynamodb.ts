import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const client = (region: string) =>
  new DynamoDBClient({ region, maxAttempts: 3 });
