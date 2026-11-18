import { getBearerToken, logApiError, type ApiRequest, sendJson } from "../../server/http";
import { getOrderKey, getOrderRedis, type StoredOrder } from "../../server/orderStorage";

export default async function handler(request: ApiRequest, response: Parameters<typeof sendJson>[0]) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Metode permintaan tidak didukung." });
    return;
  }

  const token = getBearerToken(request);
  if (!token) {
    sendJson(response, 401, { error: "Sesi unggahan tidak valid." });
    return;
  }

  try {
    const order = await getOrderRedis().hgetall<StoredOrder>(getOrderKey(token));
    if (!order?.code) {
      sendJson(response, 410, { error: "Sesi pesanan berakhir. Buka checkout lagi untuk mencoba ulang." });
      return;
    }
    if (!order.frontFileId || !order.backFileId) {
      sendJson(response, 409, { error: "Kedua sisi desain belum tersimpan. Coba unggah ulang." });
      return;
    }
    sendJson(response, 200, { code: order.code });
  } catch (error) {
    logApiError("Order completion check failed", error);
    sendJson(response, 503, { error: "Status pesanan tidak dapat diperiksa. Coba lagi." });
  }
}
