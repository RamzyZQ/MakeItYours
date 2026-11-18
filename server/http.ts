import type { IncomingMessage, ServerResponse } from "node:http";

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export function logApiError(operation: string, error: unknown): void {
  const detail = error instanceof Error
    ? error.message.replace(/[\r\n\t]+/g, " ").slice(0, 200)
    : "UnknownError";
  console.error(operation, detail);
}

export function getBearerToken(request: ApiRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(header);
  return match?.[1] ?? null;
}
