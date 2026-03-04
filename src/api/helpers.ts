import { ApiError } from './errors';

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { ...headers },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function errorResponse(error: ApiError): Response {
  const body: Record<string, unknown> = {
    type: 'about:blank',
    title: error.title,
    status: error.statusCode,
    detail: error.message,
  };
  if (error.details !== null) {
    body['details'] = error.details;
  }
  return Response.json(body, {
    status: error.statusCode,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    throw new ApiError(400, 'Bad Request', 'Invalid JSON body');
  }
}
