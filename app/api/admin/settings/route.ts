import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSetting, setSetting } from "@/lib/storage";

export const runtime = "nodejs";
const KEY = "default_purchase_url";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json({ defaultUrl: (await getSetting(KEY)) ?? "" });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const url = String(body.defaultUrl ?? "").trim();
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Default URL must start with http:// or https://." }, { status: 400 });
  }
  await setSetting(KEY, url);
  return NextResponse.json({ ok: true });
}
