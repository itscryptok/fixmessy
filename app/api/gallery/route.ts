import { NextResponse } from "next/server";
import { listGalleryPairs } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pairs = await listGalleryPairs();
    return NextResponse.json({ pairs });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not load the gallery. Please try again." }, { status: 500 });
  }
}
