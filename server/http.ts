import type { VercelRequest, VercelResponse } from "@vercel/node";

// Re-export Vercel types so API handlers can import from here
export type ApiRequest = VercelRequest;
export type ApiResponse = VercelResponse;

export function sendJson(
  response: VercelResponse,
  statusCode: number,
  payload: Record<string, unknown>,
): void {
  response.status(statusCode).json(payload);
}

export function logApiError(operation: string, error: unknown): void {
  const detail = error instanceof Error
    ? error.message.replace(/[\r\n\t]+/g, " ").slice(0, 200)
    : "UnknownError";
  console.error(operation, detail);
}

export function getBearerToken(request: VercelRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(header);
  return match?.[1] ?? null;
}
