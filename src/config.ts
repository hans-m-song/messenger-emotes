export enum Stage {
  Live = 'live',
  Local = 'local',
}

const isLocal = process.env.STAGE === Stage.Local;
const region = process.env.AWS_REGION ?? 'ap-southeast-2';
const stage = isLocal ? Stage.Local : Stage.Live;
const emotesTableName = process.env.EMOTES_TABLE_NAME ?? 'messenger-emotes';
const emotesBucketName = process.env.EMOTES_BUCKET_NAME ?? 'messenger-emotes';
const dynamodbEndpoint = 'http://localhost:8000';

export const config = {
  /**
   * AWS region
   */
  region,
  /**
   * Type of deployed instance, one of:
   * * `live`
   * * `local`
   */
  stage,
  /**
   * Name of emotes dynamodb table
   */
  emotesTableName,
  /**
   * Name of emotes s3 bucket
   */
  emotesBucketName,
  /**
   * Endpoint override for local development
   */
  dynamodbEndpoint: isLocal ? dynamodbEndpoint : undefined,
};
