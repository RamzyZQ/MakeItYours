import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearAdminSession, hasAdminSession } from "../../server/adminAuth.js";
import { sendJson } from "../../server/http.js";

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET") {
    sendJson(response, 200, { authenticated: hasAdminSession(request) });
    return;
  }
  if (request.method === "DELETE") {
    clearAdminSession(response);
    sendJson(response, 200, { authenticated: false });
    return;
  }
  response.setHeader("Allow", "GET, DELETE");
  sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
}
