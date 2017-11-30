import { string } from 'yup';
import type { Schema } from 'yup'; // eslint-disable-line
import Option from '../Option';
import type { DescribableAliasOptions } from '../Usage/Describable';

export const schema: Schema<string> = string();

export default class StringOption extends Option<string> {

  static get typeName(): string {
    return 'string';
  }

  constructor(options: DescribableAliasOptions) {
    super(Object.assign({}, options, { schema }));
  }

}
