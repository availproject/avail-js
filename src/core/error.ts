export class GeneralError {
  public constructor(
    public value: string,
    public code?: number,
  ) {}

  toError(): Error {
    return new Error(this.value)
  }
}
