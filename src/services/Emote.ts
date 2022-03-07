import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

export interface IEmote {
  id: string;
  trigger: string;
  url: string;
}

export class Emote implements IEmote {
  id!: string;
  trigger!: string;
  url!: string;

  static withoutId = (emote: Omit<IEmote, 'id'>) =>
    new Emote({ ...emote, id: randomUUID() });

  static fromAttributes = (attributes: Record<string, AttributeValue>) => {
    if (
      typeof attributes.id?.S !== 'string' ||
      typeof attributes.trigger?.S !== 'string' ||
      typeof attributes.url?.S !== 'string'
    ) {
      throw new Error('Not enough attributes to instantiate an emote');
    }

    return new Emote({
      id: attributes.id.S,
      trigger: attributes.trigger.S,
      url: attributes.url.S,
    });
  };

  constructor(emote: IEmote) {
    Object.assign(this, emote);
  }

  toAttributes(): Record<string, AttributeValue> {
    return {
      id: { S: this.id },
      trigger: { S: this.trigger },
    };
  }
}
