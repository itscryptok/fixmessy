import { NextRequest, NextResponse } from "next/server";
import { createAdminPassword, createAdminSession, isAdminSetup } from "@/lib/admin";

export const runtime = "nodejs";

// First-run setup: only works when no admin password exists yet.
export async function POST(req: NextRequest) {
  try {
    if (await isAdminSetup()) {
      return NextResponse.json({ error: "An admin password is already set. Use the login form." }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const password = String(body.password ?? "");
    const confirm = String(body.confirm ?? "");
    if (password !== confirm) {
      return NextResponse.json({ error: "The two passwords do not match." }, { status: 400 });
    }
    await createAdminPassword(password);
    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not set the password." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ setupNeeded: !(await isAdminSetup()) });
}
