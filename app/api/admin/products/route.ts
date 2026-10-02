import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { listProducts, setProductUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const sort = req.nextUrl.searchParams.get("sort") === "name" ? "name" : "popularity";
  const products = await listProducts(sort);
  return NextResponse.json({ products });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const purchaseUrl = body.purchaseUrl == null ? null : String(body.purchaseUrl);
  if (!id) return NextResponse.json({ error: "Missing product id." }, { status: 400 });
  if (purchaseUrl && !/^https?:\/\//i.test(purchaseUrl.trim())) {
    return NextResponse.json({ error: "Purchase URL must start with http:// or https://." }, { status: 400 });
  }
  try {
    await setProductUrl(id, purchaseUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save the URL." }, { status: 400 });
  }
}
