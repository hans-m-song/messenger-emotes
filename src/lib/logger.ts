import { match, when, __ } from 'ts-pattern';

import { isFunction } from './guards';

type LogMeta = Record<string, unknown>;

enum Severity {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}

interface LoggerProps {
  namespace?: string;
  meta?: LogMeta;
}

const serialiseError = (error?: unknown) =>
  match(error)
    .with(__.string, (message) => ({ name: 'UnknownError', message }))
    .with(
      { name: __.string, message: __.string, stack: [__.string] },
      ({ name, message, stack }) => ({
        name,
        message,
        stack: stack.map(({ trim }) => trim()),
      }),
    )
    .with(__.nullish, () => ({
      name: 'NullError',
      message: 'No error was provided',
    }))
    .otherwise((error) => {
      const obj = error as Record<string, unknown>;
      const result: Record<string, unknown> = {
        name: obj.name ?? 'UnknownError',
        message: obj.message ?? 'Unknown error occurred',
        stack: obj.stack ?? [],
      };

      // deconstruct non-iterable out of error
      Object.getOwnPropertyNames(error).forEach((key) => {
        if (!result[key]) {
          result[key] = (error as Record<string, unknown>)[key];
        }
      });

      return result;
    });

export class Logger {
  namespace: string;
  meta: LogMeta;

  constructor({ namespace, meta }: LoggerProps = {}) {
    this.namespace = namespace ?? '';
    this.meta = { ...meta };
  }

  withContext(context: string | Function, meta?: LogMeta) {
    const name =
      typeof context === 'string'
        ? context
        : typeof context === 'function'
        ? context.name
        : 'unknown';

    return new Logger({
      namespace: [this.namespace, name].filter(Boolean).join('.'),
      meta: { ...this.meta, ...meta },
    });
  }

  add(key: string, value: unknown): Logger {
    const resolved = match(value)
      .with({ toJSON: when(isFunction) }, ({ toJSON }) => toJSON())
      .with({ toString: when(isFunction) }, ({ toString }) => toString())
      .otherwise((value) => value);
    return this.withContext('', { ...this.meta, [key]: resolved });
  }

  private emit(severity: Severity, message?: string) {
    console.log({ severity, ...this.meta, message });
  }

  debug(message?: string) {
    this.emit(Severity.Debug, message);
  }

  info(message?: string) {
    this.emit(Severity.Info, message);
  }

  warn(message?: string) {
    this.emit(Severity.Warn, message);
  }

  error(message?: string, error?: unknown) {
    const instance = error ? this.add('error', serialiseError(error)) : this;
    instance.emit(Severity.Error, message);
  }
}
