export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly title: string,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFound(message: string): ApiError {
  return new ApiError(404, 'Not Found', message);
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, 'Bad Request', message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, 'Conflict', message);
}

export function unprocessable(message: string): ApiError {
  return new ApiError(422, 'Unprocessable Entity', message);
}
