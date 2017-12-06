import type { Schema } from 'yup';
import { UsageError } from './Error';
import { DescribableAlias } from './Usage/Describable';
import { name, desc, info } from './Usage/format';
import type { DescribableAliasOptions } from './Usage/Describable'; // eslint-disable-line
import type { ArgumentHandler } from './ArgumentHandler';
import type Context, { RunAction } from './Context';

export type OptionValue = string | number | boolean;
export type SetValueCallback = (OptionValue) => any

export class MissingArgumentError extends UsageError {}
export class InvalidArgumentError extends UsageError {}

export type TypedOptionOptions = DescribableAliasOptions & {
  run?: RunAction,
  set?: SetValueCallback
}

export type RawOptionOptions = TypedOptionOptions & {
  schema: Schema<*>,
}

export default class Option<T: OptionValue> extends DescribableAlias implements ArgumentHandler {

  name: string
  alias: string[]
  schema: Schema<*>
  _action: ?RunAction
  _setValueCallback: ?SetValueCallback

  get typeName(): string {
    return this.schema._type;
  }

  constructor(options: RawOptionOptions) {
    super(options);

    this.schema = options.schema; // FIXME: Throw error if missing

    if (options.run) {
      this._action = options.run;
    }

    if (options.set) {
      this._setValueCallback = options.set;
    }
  }

  async getValue(context: Context): Promise<T> {
    const { currentArg } = context;

    let rawValue: string;
    let pickValueArg: boolean = false;

    if (!currentArg) {
      throw new Error('Cannot get value without a current arg');
    }

    if (currentArg.value) {
      rawValue = currentArg.value;
    } else {
      const nextArg = context.nextArg;
      pickValueArg = true;

      if (!nextArg || nextArg.isOption) {
        throw new MissingArgumentError(`Missing argument for '${this.name}' option`, context);
      }

      rawValue = nextArg.raw;
    }

    try {
      const converted: any = await this.schema.validate(rawValue);

      if (pickValueArg) {
        context.pickNextArg();
      }

      return converted;
    } catch (e) {
      throw new InvalidArgumentError(
        `Invalid value for '${this.name}' option: '${rawValue}'`,
        context
      );
    }
  }

  async handle(context: Context): Promise<Context> {
    const value: any = await this.getValue(context);

    context.setOption(this.name, value);

    if (this._setValueCallback) {
      await Promise.resolve()
        .then(() => this._setValueCallback && this._setValueCallback(value));
    }

    if (this._action) {
      context.setAction(this._action);
    }

    return context;
  }

  get usageInfo(): string[] {
    return [name(`--${this.usageInfoName}`), desc(this.description), info(`[${this.typeName}]`)];
  }

}
