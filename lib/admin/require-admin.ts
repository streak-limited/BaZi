import { isAdminAuthenticated } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
