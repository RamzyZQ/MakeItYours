import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import process from "node:process";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ADMIN_PIN_HASH_KEY } from "./storeSettings.js";
import { getOrderRedis } from "./orderStorage.js";

const SESSION_COOKIE = "miy_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET harus diisi dengan minimal 32 karakter.");
  }
  return secret;
}

function pinHash(pin: string, salt: string): string {
  return scryptSync(pin, salt, 64).toString("hex");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const redis = getOrderRedis();
  const storedHash = await redis.get<string>(ADMIN_PIN_HASH_KEY);
  if (storedHash) {
    const parts = storedHash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      throw new Error("Hash PIN admin di Upstash tidak valid.");
    }
    return safeCompare(pinHash(pin, parts[1]), parts[2]);
  }

  const initialPin = process.env.ADMIN_PIN;
  if (!initialPin) throw new Error("ADMIN_PIN belum dikonfigurasi.");
  if (initialPin.length < 8) throw new Error("ADMIN_PIN harus memiliki minimal 8 karakter.");
  return safeCompare(pin, initialPin);
}

export async function saveAdminPin(pin: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const hash = pinHash(pin, salt);
  await getOrderRedis().set(ADMIN_PIN_HASH_KEY, `scrypt$${salt}$${hash}`);
}

function signExpiry(expiry: string): string {
  return createHmac("sha256", getSessionSecret()).update(`admin:${expiry}`).digest("hex");
}

function getCookie(request: VercelRequest): string | null {
  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader !== "string") return null;
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(SESSION_COOKIE.length + 1) ?? null;
}

export function setAdminSession(response: VercelResponse): void {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  const token = `${expiry}.${signExpiry(expiry)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearAdminSession(response: VercelResponse): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
}

export function hasAdminSession(request: VercelRequest): boolean {
  const token = getCookie(request);
  if (!token) return false;
  const [expiry, signature, extra] = token.split(".");
  if (!expiry || !signature || extra || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  try {
    return safeCompare(signExpiry(expiry), signature);
  } catch {
    return false;
  }
}

export function isSameOriginRequest(request: VercelRequest): boolean {
  const origin = request.headers.origin;
  if (typeof origin !== "string") return true;
  const host = request.headers.host;
  if (typeof host !== "string") return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
