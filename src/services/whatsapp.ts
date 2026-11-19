import { SHOP_NAME, WHATSAPP_NUMBER } from "../config";
import { FRAME_MODELS, type KeychainOrder } from "../types/keychain";
import { BASE_TYPE_LABELS, type BaseType, type BeadRecord } from "../types/beads";
import { getBead } from "../game/beads";

export function isWhatsAppConfigured(): boolean {
  return WHATSAPP_NUMBER.length >= 8;
}

export function openWhatsApp(text: string, targetWindow?: Window | null): boolean {
  if (!isWhatsAppConfigured()) return false;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  if (targetWindow) {
    targetWindow.location.href = url;
    return true;
  }
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!openedWindow) return false;
  return true;
}

export function buildKeychainMessage(order: KeychainOrder, stockRemaining?: number): string {
  const frame = FRAME_MODELS.find((f) => f.id === order.frameModel)?.label ?? order.frameModel;
  const frontSlotCount = order.photoSlotCount ?? 3;
  const frontPhotoCount = order.photos.slice(0, frontSlotCount).filter(Boolean).length;
  const backSlotCount = order.backPhotoSlotCount ?? 1;
  const backPhotoCount = (order.backPhotos ?? []).slice(0, backSlotCount).filter(Boolean).length;
  const name = order.customerName.trim() || "Pelanggan";

  const lines = [
    `Halo ${SHOP_NAME}!`,
    `Saya ingin pesan *Keychain Custom* (tanpa login, langsung dari website):`,
    ``,
    `• Nama: ${name}`,
    `• Varian warna frame dan aksesori: ${frame}${
      stockRemaining !== undefined ? ` (sisa stok ${stockRemaining})` : ""
    }`,
    ...(order.templateName ? [`• Template photobooth: ${order.templateName}`] : []),
    `• Foto sisi depan: ${frontPhotoCount}/${frontSlotCount}`,
    `• Foto sisi belakang: ${backPhotoCount}/${backSlotCount}`,
  ];

  if (order.note.trim()) {
    lines.push(`• Catatan: ${order.note.trim()}`);
  }

  lines.push(
    ``,
    `Foto custom akan saya kirim di chat ini sebagai lampiran.`,
    `Mohon infokan ketersediaan, harga, dan cara pembayarannya ya. Terima kasih!`,
  );

  return lines.join("\n");
}

export function buildBeadDesignMessage(opts: {
  name: string;
  base: BaseType;
  beads: BeadRecord[];
  customerName: string;
  note: string;
}): string {
  const customer = opts.customerName.trim() || "Pelanggan";
  const beadList = opts.beads
    .map((b, i) => `  ${i + 1}. ${getBead(b.type).name}`)
    .join("\n");

  const lines = [
    `Halo ${SHOP_NAME}!`,
    `Saya ingin pesan rangkaian *${BASE_TYPE_LABELS[opts.base]}* dari studio (tanpa login):`,
    ``,
    `• Nama: ${customer}`,
    `• Judul desain: ${opts.name.trim() || BASE_TYPE_LABELS[opts.base]}`,
    `• Jumlah manik: ${opts.beads.length}`,
    `• Daftar manik:`,
    beadList || "  (belum ada manik)",
  ];

  if (opts.note.trim()) {
    lines.push(`• Catatan: ${opts.note.trim()}`);
  }

  lines.push(
    ``,
    `Mohon infokan ketersediaan, harga, dan cara pembayarannya ya. Terima kasih!`,
  );

  return lines.join("\n");
}

export function compressImageFile(file: File, maxSize = 720, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak tersedia"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
