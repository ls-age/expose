import colors from 'chalk';
import Command from './Command';
import Context from './Context';
import { UsageError, ImplementationError } from './Error';

type ExposeOptions = {
  description?: string,
}

export default class Expose extends Command {

  _context: ?Context
  logger: {
    +log: (...data: Array<any>) => void,
    +error: (...data: Array<any>) => void
  }

  constructor(options: ExposeOptions) {
    const name: string = process.argv[1];

    super(Object.assign({}, { name }, options));

    this.logger = console;
  }

  parse(args: true | string[] = true): Promise<Context> {
    const argsToUse: string[] = (args === true) ?
      process.argv.slice(2) :
      args;

    const nonEmptyArgs: string[] = argsToUse.filter(a => a.length);

    this._context = new Context(this, {
      args: nonEmptyArgs,
      config: {}, // FIXME: Insert config arg value
    });

    return this.handle(this._context);
  }

  printUsage(err: ?Error = undefined, exitCode: number = 1) {
    if (err) {
      if (err instanceof UsageError) {
        this.logger.error(err.context.getUsage());
      } else if (this._context) {
        this.logger.error(this._context.getUsage());
      }

      this.logger.error('');
      this.logger.error(colors.red(err.message));

      process.exitCode = exitCode;
      return;
    }

    if (this._context) {
      this.logger.log(this._context.getUsage());
    } else {
      throw new Error('No arguments parsed yet');
    }
  }

  async run({ args }: { args?: string[] } = {}): Promise<any> {
    let context: ?Context;

    try {
      context = await this.parse(args);

      if (!context.hasAction) {
        if (context.currentCommand === this) {
          throw new UsageError('No command specified', context);
        } else {
          throw new ImplementationError('No action for current command', context);
        }
      }
    } catch (err) {
      this.printUsage(err);
      context = null;
    }

    if (context) {
      return context.execute();
    }

    return null;
  }

}
