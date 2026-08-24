export type ErrorDetails = Record<string, unknown>;

export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
