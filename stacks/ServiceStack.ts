import * as sst from '@serverless-stack/resources';

export class ServiceStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    const table = new sst.Table(this, 'Table', {
      primaryIndex: { partitionKey: 'id' },
      fields: { id: sst.TableFieldType.STRING },
    });

    const bucket = new sst.Bucket(this, 'Bucket');

    scope.addDefaultFunctionEnv({
      STAGE: this.stage,
      EMOTES_TABLE_NAME: table.tableName,
      EMOTES_BUCKET_NAME: bucket.bucketName,
    });

    const api = new sst.Api(this, 'Api', {
      routes: {
        'POST /api/emotes': {
          functionName: 'CreateEmote',
          handler: 'src/handlers/createEmote.handler',
        },
        'DELETE /api/emotes/{id}': {
          functionName: 'DeleteEmote',
          handler: 'src/handlers/deleteEmote.handler',
        },
        'GET /api/emotes/{id}': {
          functionName: 'GetEmote',
          handler: 'src/handlers/getEmote.handler',
        },
        'GET /api/emotes': {
          functionName: 'ListEmotes',
          handler: 'src/handlers/listEmotes.handler',
        },
        'PUT /api/emotes/{id}': {
          functionName: 'UpdateEmote',
          handler: 'src/handlers/updateEmote.handler',
        },
      },
    });

    api.attachPermissions([bucket, table]);

    this.addOutputs({
      ApiUrl: api.url,
      tableName: table.tableName,
      bucketName: bucket.bucketName,
    });
  }
}
