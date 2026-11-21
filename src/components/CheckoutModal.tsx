import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { isWhatsAppConfigured, openWhatsApp } from "../services/whatsapp";

export default function CheckoutModal({
  open,
  title,
  summary,
  preview,
  buildMessage,
  photoHint,
  showCustomerFields = true,
  submitLabel = "Kirim Pesanan via WhatsApp",
  compactPreviewOnly = false,
  onBeforeSend,
  onClose,
}: {
  open: boolean;
  title: string;
  summary: React.ReactNode;
  preview?: React.ReactNode;
  buildMessage: (customerName: string, note: string) => string;
  photoHint?: string;
  showCustomerFields?: boolean;
  submitLabel?: string;
  compactPreviewOnly?: boolean;
  onBeforeSend?: () => string | null | Promise<string | null>;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const initialFocus = showCustomerFields ? nameInputRef.current : closeButtonRef.current;
    if (initialFocus) {
      initialFocus.focus();
    } else {
      dialogRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, showCustomerFields]);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    if (!isWhatsAppConfigured()) {
      setError("Nomor WhatsApp toko belum diatur. Isi VITE_WHATSAPP_NUMBER di file .env.local.");
      return;
    }
    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      setError("WhatsApp tidak dapat dibuka. Coba izinkan pop-up di browser.");
      return;
    }
    // Tampilkan halaman loading sementara menunggu proses upload
    whatsappWindow.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Menyiapkan pesanan…</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FFF8FA;color:#372A3C;flex-direction:column;gap:12px}
      .dot{width:10px;height:10px;border-radius:50%;background:#F472B6;display:inline-block;animation:bounce 1.2s ease infinite}
      .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
      @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}</style></head>
      <body><p style="font-weight:700;font-size:18px">🌸 Menyiapkan pesanmu…</p>
      <div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      <p style="font-size:13px;color:#8B7A90">Sedang mengupload desain ke server</p></body></html>`
    );
    whatsappWindow.document.close();
    setError(null);
    setIsSending(true);
    try {
      const beforeSendError = await onBeforeSend?.();
      if (beforeSendError) {
        whatsappWindow.close();
        setError(beforeSendError);
        return;
      }
      const ok = openWhatsApp(buildMessage(customerName, note), whatsappWindow);
      if (!ok) {
        whatsappWindow.close();
        setError("Gagal membuka WhatsApp. Coba izinkan pop-up di browser.");
        return;
      }
      onClose();
    } catch (sendError) {
      whatsappWindow.close();
      setError(sendError instanceof Error ? sendError.message : "Gagal menyiapkan file pesanan.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        aria-describedby={compactPreviewOnly ? undefined : "checkout-description"}
        tabIndex={-1}
        className={`w-full my-auto border-2 border-[#FCE7F3] bg-white shadow-2xl overflow-y-auto ${
          compactPreviewOnly
            ? "max-w-[380px] md:max-w-2xl lg:max-w-3xl rounded-3xl p-5 md:p-7 max-h-[min(92vh,760px)]"
            : "max-w-md rounded-3xl p-6 max-h-[min(92vh,720px)]"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            id="checkout-title"
            className={`font-display font-bold text-[#372A3C] ${compactPreviewOnly ? "text-base" : "text-xl"}`}
          >
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="h-12 w-12 rounded-full bg-[#FFF0F5] text-[#6B5E70] flex items-center justify-center hover:bg-[#FCE7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] focus-visible:ring-offset-2"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {preview}

        {!compactPreviewOnly && (
          <div className="rounded-2xl bg-[#FFF8FA] p-3 text-xs text-[#6B5E70] leading-relaxed space-y-1">
            {summary}
          </div>
        )}

        {!compactPreviewOnly && (
          <p id="checkout-description" className="mt-3 text-xs text-[#8B7A90]">
            Tidak perlu akun. Pesanan dikirim langsung ke WhatsApp toko.
          </p>
        )}

        <form onSubmit={handleSend} className={`${compactPreviewOnly ? "mt-3" : "mt-4"} space-y-3`}>
          {showCustomerFields && (
            <>
              <div>
                <label htmlFor="checkout-customer-name" className="meta-label text-[#8B7A90] block mb-1">Nama panggilan</label>
                <input
                  ref={nameInputRef}
                  id="checkout-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={40}
                  placeholder="Contoh: Raka, Nia"
                  className="min-h-11 w-full rounded-2xl border-2 border-[#FCE7F3] px-4 py-2.5 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777]"
                />
              </div>
              <div>
                <label htmlFor="checkout-note" className="meta-label text-[#8B7A90] block mb-1">Catatan (opsional)</label>
                <textarea
                  id="checkout-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Contoh: kirim minggu ini, wrapping kado..."
                  className="min-h-11 w-full rounded-2xl border-2 border-[#FCE7F3] px-4 py-2.5 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] resize-none"
                />
              </div>
            </>
          )}

          {photoHint && !compactPreviewOnly && (
            <p className="text-[11px] leading-relaxed text-[#8B7A90] bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl px-3 py-2">
              {photoHint}
            </p>
          )}

          {error && (
            <p role="alert" className="text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSending} className="btn-pastel-primary min-h-12 w-full !bg-gradient-to-r !from-[#25D366] !to-[#128C7E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
            <MessageCircle className="h-4 w-4" />
            <span>{isSending ? "Menyiapkan file…" : submitLabel}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
