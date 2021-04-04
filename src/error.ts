export class CommandProcessingError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "CommandProcessingError";
    Object.setPrototypeOf(this, CommandProcessingError.prototype);
  }
}
