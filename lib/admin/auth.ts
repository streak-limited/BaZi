import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_auth";

export function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminSecret());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === secret;
}
