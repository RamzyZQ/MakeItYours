import { Readable } from "node:stream";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, logApiError, sendJson } from "../../server/http";
import {
  getDriveClient,
  getOrderKey,
  getOrderRedis,
  type StoredOrder,
} from "../../server/orderStorage";

const MAX_PNG_BYTES = 4_480_000;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function readPng(request: VercelRequest): Promise<Buffer> {
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (contentLength > MAX_PNG_BYTES) {
    throw new RangeError("Ukuran PNG melebihi batas unggahan 4,48 MB.");
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_PNG_BYTES) {
      throw new RangeError("Ukuran PNG melebihi batas unggahan 4,48 MB.");
    }
    chunks.push(buffer);
  }
  const image = Buffer.concat(chunks);
  if (
    image.length < 24 ||
    !image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    throw new TypeError("File yang diunggah bukan PNG yang valid.");
  }
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (!width || !height || width > 4096 || height > 4096 || width * height > 4_000_000) {
    throw new TypeError("Dimensi PNG tidak valid.");
  }
  return image;
}

// Disable Vercel's body parser so we can read the raw PNG stream
export const config = { api: { bodyParser: false } };

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "PUT") {
    response.setHeader("Allow", "PUT");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }

  const token = getBearerToken(request);
  // Vercel parses query params automatically into req.query
  const side = Array.isArray(request.query?.side)
    ? request.query.side[0]
    : request.query?.side;
  if (!token || (side !== "front" && side !== "back")) {
    sendJson(response, 400, { error: "Token unggahan atau sisi desain tidak valid." });
    return;
  }
  if (request.headers["content-type"]?.split(";")[0] !== "image/png") {
    sendJson(response, 415, { error: "Unggahan harus menggunakan format PNG." });
    return;
  }

  let image: Buffer;
  try {
    image = await readPng(request);
  } catch (error) {
    sendJson(response, error instanceof RangeError ? 413 : 400, {
      error: error instanceof Error ? error.message : "File PNG tidak dapat dibaca.",
    });
    return;
  }

  try {
    const redis = getOrderRedis();
    const orderKey = getOrderKey(token);
    const order = await redis.hgetall<StoredOrder>(orderKey);
    if (!order?.code) {
      sendJson(response, 410, { error: "Sesi pesanan berakhir. Buka checkout lagi untuk mencoba ulang." });
      return;
    }

    const { drive, folderId } = getDriveClient();
    const oldFileId = side === "front" ? order.frontFileId : order.backFileId;
    const fileName = `${order.code}-${side === "front" ? "depan" : "belakang"}.png`;
    const media = { mimeType: "image/png", body: Readable.from([image]) };
    const uploadResult = oldFileId
      ? await drive.files.update({
          fileId: oldFileId,
          requestBody: { name: fileName },
          media,
          fields: "id",
        })
      : await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: "image/png",
            parents: [folderId],
            appProperties: {
              orderCode: order.code,
              side,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          media,
          fields: "id",
        });

    const fileId = uploadResult.data.id;
    if (!fileId) throw new Error("Google Drive tidak mengembalikan ID file.");
    await redis.hset(orderKey, { [`${side}FileId`]: fileId });
    sendJson(response, 200, { ok: true, side });
  } catch (error) {
    logApiError("Order image upload failed", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("belum lengkap")) {
      sendJson(response, 503, { error: message });
      return;
    }
    sendJson(response, 502, { error: "Desain gagal tersimpan ke Drive. Periksa koneksi lalu coba lagi." });
  }
}
