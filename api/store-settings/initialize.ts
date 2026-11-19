import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAdminSession, isSameOriginRequest } from "../../server/adminAuth.js";
import { logApiError, sendJson } from "../../server/http.js";
import { initializeStoreSettings, readStoreSettings } from "../../server/storeSettings.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
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
    await initializeStoreSettings(request.body.settings);
    sendJson(response, 200, await readStoreSettings());
  } catch (error) {
    logApiError("Initial store settings import failed", error);
    sendJson(response, 503, { error: "Impor pengaturan lama gagal. Coba lagi." });
  }
}
