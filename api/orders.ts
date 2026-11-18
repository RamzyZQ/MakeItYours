import { createHash, randomBytes } from "node:crypto";
import process from "node:process";
import { logApiError, sendJson, type ApiRequest } from "../server/http";
import { getDriveClient, getOrderKey, getOrderRedis, ORDER_TTL_SECONDS } from "../server/orderStorage";

const ACCESSORY_COLORS = new Set(["pink", "hitam", "merah", "biru"]);
const ORDER_LIMIT_PER_HOUR = 5;

function getClientAddress(request: ApiRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const firstAddress = forwardedFor.split(",")[0]?.trim();
    if (firstAddress) return firstAddress;
  }
  return request.socket.remoteAddress ?? "unknown";
}

function getOrderDetails(body: unknown): {
  templateId: string;
  templateName: string;
  frameModel: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const details = body as Record<string, unknown>;
  if (
    typeof details.templateId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,40}$/.test(details.templateId) ||
    typeof details.templateName !== "string" ||
    details.templateName.trim().length < 1 ||
    details.templateName.trim().length > 80 ||
    typeof details.frameModel !== "string" ||
    !ACCESSORY_COLORS.has(details.frameModel)
  ) {
    return null;
  }
  return {
    templateId: details.templateId,
    templateName: details.templateName.trim(),
    frameModel: details.frameModel,
  };
}

export default async function handler(request: ApiRequest, response: Parameters<typeof sendJson>[0]) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }

  const details = getOrderDetails(request.body);
  if (!details) {
    sendJson(response, 400, { error: "Informasi template atau warna aksesori tidak valid." });
    return;
  }

  try {
    getDriveClient();
    const redis = getOrderRedis();
    const addressHash = createHash("sha256").update(getClientAddress(request)).digest("hex");
    const rateLimitKey = `miy:order-rate:${addressHash}`;
    const orderCount = await redis.incr(rateLimitKey);
    if (orderCount === 1) await redis.expire(rateLimitKey, 60 * 60);
    if (orderCount > ORDER_LIMIT_PER_HOUR) {
      sendJson(response, 429, { error: "Batas pembuatan kode tercapai. Coba lagi satu jam lagi." });
      return;
    }

    const sequence = await redis.incr("miy:order-sequence");
    const code = `MIY-${200 + sequence}`;
    const uploadToken = randomBytes(32).toString("base64url");
    const orderKey = getOrderKey(uploadToken);
    const record = {
      code,
      ...details,
      createdAt: new Date().toISOString(),
      frontFileId: "",
      backFileId: "",
    };

    try {
      await redis.hset(orderKey, record);
      await redis.expire(orderKey, ORDER_TTL_SECONDS);
    } catch (error) {
      await redis.del(orderKey);
      throw error;
    }

    sendJson(response, 201, { code, uploadToken });
  } catch (error) {
    logApiError("Order creation failed", error);
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("belum lengkap") ||
      message.includes("harus berisi JSON") ||
      message.includes("Kredensial Google")
    ) {
      sendJson(response, 503, {
        error: "Konfigurasi Google Drive atau Upstash belum lengkap. Hubungi operator.",
      });
      return;
    }
    sendJson(response, 503, { error: "Layanan pesanan sedang tidak tersedia. Coba lagi nanti." });
  }
}
