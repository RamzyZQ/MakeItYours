/** Shop settings used by guest checkout (no login required). */

export const WHATSAPP_NUMBER = (
  import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined
)?.replace(/\D/g, "") || "";

export const SHOP_NAME = "MakeitYours";
