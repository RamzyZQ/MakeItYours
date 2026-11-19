import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAdminSession, isSameOriginRequest } from "../server/adminAuth.js";
import { logApiError, sendJson } from "../server/http.js";
import { readStoreSettings, writeStoreSettings } from "../server/storeSettings.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    try {
      sendJson(response, 200, await readStoreSettings());
    } catch (error) {
      logApiError("Store settings read failed", error);
      sendJson(response, 503, { error: "Pengaturan toko tidak dapat dimuat. Coba lagi nanti." });
    }
    return;
  }

  if (request.method !== "PUT") {
    response.setHeader("Allow", "GET, PUT");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }

  if (!isSameOriginRequest(request) || !hasAdminSession(request)) {
    sendJson(response, 401, { error: "Sesi admin tidak valid atau telah berakhir." });
    return;
  }
  if (!request.body || typeof request.body !== "object" || !("settings" in request.body)) {
    sendJson(response, 400, { error: "Data pengaturan toko tidak valid." });
    return;
  }

  try {
    const settings = await writeStoreSettings(request.body.settings);
    sendJson(response, 200, { settings, initialized: true });
  } catch (error) {
    logApiError("Store settings write failed", error);
    sendJson(response, 503, { error: "Pengaturan toko gagal disimpan. Coba lagi." });
  }
}
