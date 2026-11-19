import { drive_v3 } from "@googleapis/drive";
import { Redis } from "@upstash/redis";
import { OAuth2Client } from "google-auth-library";
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!folderId || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Konfigurasi Google Drive belum lengkap.");
  }

  const auth = new OAuth2Client(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return {
    drive: new drive_v3.Drive({ auth }),
    folderId,
  };
}
