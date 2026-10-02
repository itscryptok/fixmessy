import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getAdminPasswordHash, getSetting, setAdminPasswordHash, setSetting } from "./storage";

const COOKIE = "fixmessy_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function newToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export async function isAdminSetup(): Promise<boolean> {
  return (await getAdminPasswordHash()) !== null;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await getAdminPasswordHash();
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function createAdminPassword(password: string): Promise<void> {
  if (await isAdminSetup()) throw new Error("Admin password is already set.");
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const hash = await bcrypt.hash(password, 12);
  await setAdminPasswordHash(hash);
}

export async function createAdminSession(): Promise<string> {
  const token = newToken();
  const expires = Date.now() + SESSION_TTL_MS;
  await setSetting(`admin_session:${token}`, String(expires));
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

export async function isAdminRequest(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const expires = await getSetting(`admin_session:${token}`);
  if (!expires || Number(expires) < Date.now()) return false;
  return true;
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await setSetting(`admin_session:${token}`, "0");
  jar.set(COOKIE, "", { path: "/", maxAge: 0 });
}
