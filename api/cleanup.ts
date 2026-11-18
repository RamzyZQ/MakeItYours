import { timingSafeEqual } from "node:crypto";
import process from "node:process";
import { logApiError, sendJson, type ApiRequest } from "../server/http";
import { getDriveClient, ORDER_TTL_SECONDS } from "../server/orderStorage";

function isAuthorized(request: ApiRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  if (!secret || typeof authorization !== "string") return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export default async function handler(request: ApiRequest, response: Parameters<typeof sendJson>[0]) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }
  if (!process.env.CRON_SECRET) {
    sendJson(response, 503, { error: "CRON_SECRET belum dikonfigurasi." });
    return;
  }
  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: "Tidak diizinkan." });
    return;
  }

  try {
    const { drive, folderId } = getDriveClient();
    const cutoff = new Date(Date.now() - ORDER_TTL_SECONDS * 1000).toISOString();
    const escapedFolderId = folderId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    let pageToken: string | undefined;
    const expiredFileIds: string[] = [];

    do {
      const listing = await drive.files.list({
        q: `'${escapedFolderId}' in parents and trashed = false and createdTime < '${cutoff}'`,
        fields: "nextPageToken,files(id,name,appProperties)",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const file of listing.data.files ?? []) {
        const orderCode = file.appProperties?.orderCode;
        const side = file.appProperties?.side;
        if (
          !file.id ||
          !/^MIY-\d+$/.test(orderCode ?? "") ||
          (side !== "front" && side !== "back") ||
          file.name !== `${orderCode}-${side === "front" ? "depan" : "belakang"}.png`
        ) {
          continue;
        }
        expiredFileIds.push(file.id);
      }
      pageToken = listing.data.nextPageToken ?? undefined;
    } while (pageToken);

    for (let index = 0; index < expiredFileIds.length; index += 10) {
      await Promise.all(
        expiredFileIds.slice(index, index + 10).map((fileId) =>
          drive.files.delete({ fileId, supportsAllDrives: true }),
        ),
      );
    }

    sendJson(response, 200, { deleted: expiredFileIds.length });
  } catch (error) {
    logApiError("Expired order cleanup failed", error);
    sendJson(response, 502, { error: "Pembersihan file lama gagal. Coba jalankan lagi nanti." });
  }
}
