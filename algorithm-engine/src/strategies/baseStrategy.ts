export abstract class BaseStrategy {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract evaluate(candles: any[]): Promise<boolean>;
}
