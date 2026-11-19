import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isSameOriginRequest, setAdminSession, verifyAdminPin } from "../../server/adminAuth.js";
import { logApiError, sendJson } from "../../server/http.js";
import { getOrderRedis } from "../../server/orderStorage.js";

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_SECONDS = 15 * 60;

function getClientAddress(request: VercelRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const firstAddress = forwardedFor.split(",")[0]?.trim();
    if (firstAddress) return firstAddress;
  }
  return request.socket?.remoteAddress ?? "unknown";
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }
  if (!isSameOriginRequest(request)) {
    sendJson(response, 403, { error: "Permintaan login tidak berasal dari situs ini." });
    return;
  }
  const pin = request.body && typeof request.body.pin === "string" ? request.body.pin.trim() : "";
  if (!pin || pin.length > 128) {
    sendJson(response, 400, { error: "PIN admin wajib diisi." });
    return;
  }

  try {
    const addressHash = createHash("sha256").update(getClientAddress(request)).digest("hex");
    const rateLimitKey = `miy:admin-login:${addressHash}`;
    const redis = getOrderRedis();
    const attempts = await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, LOGIN_WINDOW_SECONDS);
    if (attempts > LOGIN_LIMIT) {
      sendJson(response, 429, { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
      return;
    }

    if (!(await verifyAdminPin(pin))) {
      sendJson(response, 401, { error: "PIN admin tidak cocok." });
      return;
    }
    await redis.del(rateLimitKey);
    setAdminSession(response);
    sendJson(response, 200, { authenticated: true });
  } catch (error) {
    logApiError("Admin login failed", error);
    sendJson(response, 503, { error: "Login admin tidak tersedia. Periksa konfigurasi server." });
  }
}
