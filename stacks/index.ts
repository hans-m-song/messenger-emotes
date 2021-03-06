import * as sst from '@serverless-stack/resources';
import { ServiceStack } from './ServiceStack';

export default function main(app: sst.App): void {
  app.setDefaultFunctionProps({
    runtime: 'nodejs14.x',
  });

  new ServiceStack(app, 'ServiceStack');
}
