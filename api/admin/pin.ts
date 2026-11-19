import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAdminSession, isSameOriginRequest, saveAdminPin, verifyAdminPin } from "../../server/adminAuth.js";
import { logApiError, sendJson } from "../../server/http.js";

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

  const currentPin = request.body && typeof request.body.currentPin === "string"
    ? request.body.currentPin.trim()
    : "";
  const newPin = request.body && typeof request.body.newPin === "string"
    ? request.body.newPin.trim()
    : "";
  if (newPin.length < 8 || newPin.length > 128) {
    sendJson(response, 400, { error: "PIN baru harus terdiri dari 8 sampai 128 karakter." });
    return;
  }

  try {
    if (!(await verifyAdminPin(currentPin))) {
      sendJson(response, 400, { error: "PIN saat ini salah." });
      return;
    }
    await saveAdminPin(newPin);
    sendJson(response, 200, { updated: true });
  } catch (error) {
    logApiError("Admin PIN update failed", error);
    sendJson(response, 503, { error: "PIN admin gagal disimpan. Coba lagi." });
  }
}
