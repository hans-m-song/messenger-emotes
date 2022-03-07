import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';

import { config, Stage } from '../config';
import { Logger } from '../lib/logger';

const ssmLogger = new Logger({ namespace: 'ssm' });
let localParameters: Record<string, string> = {};
if (config.stage === Stage.Local) {
  try {
    localParameters = JSON.parse(process.env.PARAMETER_STORE ?? '');
  } catch (error) {
    ssmLogger.error(error, 'failed to parse local parameters');
  }
}

const client = (region: string) => new SSMClient({ region, maxAttempts: 3 });

export interface ApiKey {
  name: string;
  key: string;
}

export const getParametersByPath = async (
  path: string,
  withDecrpytion = false,
  recursive = true,
): Promise<string[]> => {
  const logger = ssmLogger.withContext(getParametersByPath);
  if (config.stage === Stage.Local) {
    return Object.entries(localParameters)
      .filter(([key]) => key.startsWith(path))
      .map(([, value]) => value);
  }

  const command = new GetParametersByPathCommand({
    Path: path,
    WithDecryption: withDecrpytion,
    Recursive: recursive,
  });

  const response = await client(config.region)
    .send(command)
    .catch((error) => {
      logger.add('path', path).error(error, 'Failed to get parameters');
      return null;
    });

  if (!response?.Parameters) {
    logger.add('response', response).warn('No parameters were not returned');
  }

  return [];
};
