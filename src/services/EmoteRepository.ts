import { paginateScan } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoReturnValues } from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { config } from '../config';
import { newDynamoDBClient, serializeScanFilter } from '../lib/dynamodb';
import { Logger } from '../lib/logger';
import { StructuredError } from '../lib/types';
import { Emote, IEmote } from './Emote';

export type EmoteRepositoryResponse<T> = {
  data: T | null;
  error?: StructuredError;
};

enum EmoteErrorCode {
  NotFound = 'ErrorNotFound',
  ParseAttributes = 'ErrorParseAttributes',
}

export class EmoteRepository {
  logger: Logger;
  client: DynamoDBDocumentClient;

  constructor(logger?: Logger) {
    this.logger = (logger ?? new Logger()).withContext('EmoteRepository');
    this.client = newDynamoDBClient(config.region, config.dynamodbEndpoint);
  }

  async create(
    partialEmote: Omit<IEmote, 'id'>,
  ): Promise<EmoteRepositoryResponse<Emote | null>> {
    const logger = this.logger.withContext('create');

    const command = new PutCommand({
      TableName: config.emotesTableName,
      ReturnValues: DynamoReturnValues.ALL_NEW,
      Item: Emote.withoutId(partialEmote),
      ConditionExpression: 'attribute_not_exists(id)',
    });

    const response = await this.client.send(command).catch((error) => {
      logger.error('PutCommand failed', error);
      return null;
    });

    if (!response?.Attributes) {
      return {
        data: null,
        error: {
          name: EmoteErrorCode.NotFound,
          message: 'No attributes were returned',
          meta: response,
        },
      };
    }

    try {
      const newEmote = new Emote(response.Attributes as any);
      logger.add('emote', newEmote).info('created emote');
      return { data: newEmote };
    } catch (error) {
      logger
        .add('attributes', response.Attributes)
        .error('Failed to parse emote from attributes', error);
      return {
        data: null,
        error: { name: EmoteErrorCode.ParseAttributes, message: '' },
      };
    }
  }

  async delete(id: string): Promise<boolean> {
    const logger = this.logger.withContext('delete');

    const command = new DeleteCommand({
      TableName: config.emotesTableName,
      Key: { id },
    });

    const response = await this.client.send(command).catch((error) => {
      logger.error('DeleteCommand failed', error);
      return null;
    });

    if (response) {
      logger.add('id', id).info('deleted emote');
      return true;
    }

    return false;
  }

  async get(id: string): Promise<Emote | null> {
    const logger = this.logger.withContext('get');

    const command = new GetCommand({
      TableName: config.emotesTableName,
      Key: { id },
    });

    const response = await this.client.send(command).catch((error) => {
      logger.error('GetCommand failed', error);
      return null;
    });

    if (!response?.Item) {
      logger.error('No item was returned');
      return null;
    }

    try {
      return new Emote(response.Item as any);
    } catch (error) {
      logger
        .add('attributes', response.Item)
        .error('Failed to parse emote from attributes', error);
      return null;
    }
  }

  async list(
    filter?: Parameters<typeof serializeScanFilter>[0],
  ): Promise<Emote[]> {
    const logger = this.logger.withContext('list');

    const paginator = paginateScan(
      { client: this.client },
      { TableName: config.emotesTableName, ...serializeScanFilter(filter) },
    );

    const items: Emote[] = [];

    for await (const page of paginator) {
      page.Items?.forEach((item) => {
        try {
          items.push(Emote.fromAttributes(item));
        } catch (error) {
          logger
            .add('attributes', item)
            .error('Failed to parse emote from attributes', error);
          return [];
        }
      });
    }

    return items;
  }

  async update(
    partialEmote: Pick<IEmote, 'id'> & Partial<IEmote>,
  ): Promise<Emote | null> {
    const logger = this.logger.withContext('update');

    const command = new UpdateCommand({
      TableName: config.emotesTableName,
      Key: { id: partialEmote.id },
      ReturnValues: DynamoReturnValues.ALL_NEW,
      AttributeUpdates: Object.entries(partialEmote).reduce(
        (result, [key, value]) => ({
          ...result,
          [key]: { Action: 'SET', Value: value },
        }),
        {} as UpdateCommandInput['AttributeUpdates'],
      ),
    });

    const response = await this.client.send(command).catch((error) => {
      logger.error('UpdateCommand failed', error);
      return null;
    });

    try {
      return new Emote(response?.Attributes as any);
    } catch (error) {
      logger.error('Failed to parse emote from attributes', error);
    }
  }
}
