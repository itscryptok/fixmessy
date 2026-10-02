import { NextRequest, NextResponse } from "next/server";
import { getGalleryImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const which = req.nextUrl.searchParams.get("which");
  if (!id || (which !== "before" && which !== "after")) {
    return NextResponse.json({ error: "Invalid image request." }, { status: 400 });
  }
  const img = await getGalleryImage(id, which);
  if (!img) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(img.data.length),
    },
  });
}
