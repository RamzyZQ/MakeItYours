import { drive_v3 } from "@googleapis/drive";
import { Redis } from "@upstash/redis";
import { JWT } from "google-auth-library";
import process from "node:process";

export const ORDER_TTL_SECONDS = 30 * 24 * 60 * 60;
export const ORDER_KEY_PREFIX = "miy:order:";

export interface StoredOrder extends Record<string, string> {
  code: string;
  templateId: string;
  templateName: string;
  frameModel: string;
  createdAt: string;
  frontFileId: string;
  backFileId: string;
}

let redisClient: Redis | null = null;

export function getOrderRedis(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Konfigurasi Upstash belum lengkap.");
  }
  redisClient ??= Redis.fromEnv();
  return redisClient;
}

export function getOrderKey(uploadToken: string): string {
  return `${ORDER_KEY_PREFIX}${uploadToken}`;
}

export function getDriveClient() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!folderId || !rawCredentials) {
    throw new Error("Konfigurasi Google Drive belum lengkap.");
  }

  let credentials: { client_email?: unknown; private_key?: unknown };
  try {
    credentials = JSON.parse(rawCredentials) as typeof credentials;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON harus berisi JSON service account yang valid.");
  }
  if (
    typeof credentials.client_email !== "string" ||
    !credentials.client_email.trim() ||
    typeof credentials.private_key !== "string" ||
    !credentials.private_key.trim()
  ) {
    throw new Error("Kredensial Google Drive tidak memiliki client_email atau private_key.");
  }

  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  return {
    drive: new drive_v3.Drive({ auth }),
    folderId,
  };
}
