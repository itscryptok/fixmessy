import { NextRequest, NextResponse } from "next/server";
import { analyzePhoto, generateEditedImage } from "@/lib/ai";
import {
  getSetting,
  saveGalleryPair,
  upsertRecommendedProduct,
} from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

interface ResultItem {
  name: string;
  price: number;
  quantity: number;
  url: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const mode = form.get("mode");
    const consent = form.get("consent");
    const file = form.get("image");

    if (mode !== "reorganize" && mode !== "decor") {
      return NextResponse.json({ error: "Choose an analysis mode first." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No photo was provided. Please choose a photo and try again." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "That image could not be used. Please choose a photo under 10 MB." },
        { status: 400 }
      );
    }
    const mime = file.type || "image/jpeg";
    if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
      return NextResponse.json(
        { error: "That file is not a readable image. Please choose a JPG, PNG, or WebP photo." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // 1. Analyze (server-side only)
    let analysis;
    try {
      analysis = await analyzePhoto(bytes, mime, mode);
    } catch (e: any) {
      return NextResponse.json(
        { error: e?.message || "AI analysis failed. Please try again." },
        { status: 502 }
      );
    }

    // 2. Generate the edited image when there is something meaningful to show.
    let after: { data: Buffer; mime: string } | null = null;
    const shouldGenerate = mode === "decor" || !analysis.tidy;
    if (shouldGenerate) {
      try {
        after = await generateEditedImage(bytes, mime, mode, analysis.guide);
      } catch (e: any) {
        return NextResponse.json(
          { error: e?.message || "Image generation failed. Please try again." },
          { status: 502 }
        );
      }
    }

    // 3. Keep consistent product records; attach saved URLs (per-product or default).
    const defaultUrl = (await getSetting("default_purchase_url"))?.trim() || null;
    const items: ResultItem[] = [];
    for (const item of analysis.items) {
      try {
        const rec = await upsertRecommendedProduct(item.name);
        items.push({
          name: rec.name,
          price: item.price,
          quantity: item.quantity,
          url: rec.purchaseUrl || defaultUrl,
        });
      } catch {
        items.push({ name: item.name, price: item.price, quantity: item.quantity, url: defaultUrl });
      }
    }

    // 4. Gallery sharing — only when the user agreed AND an after image exists.
    let shared = false;
    if (consent === "yes" && after) {
      try {
        await saveGalleryPair({ mode, before: bytes, after: after.data, mimeBefore: mime, mimeAfter: after.mime });
        shared = true;
      } catch {
        // Sharing must never block or lose the analysis results.
        shared = false;
      }
    }

    return NextResponse.json({
      mode,
      tidy: analysis.tidy,
      guide: analysis.guide,
      items,
      suggestion: analysis.suggestion,
      beforeImage: `data:${mime};base64,${bytes.toString("base64")}`,
      afterImage: after ? `data:${after.mime};base64,${after.data.toString("base64")}` : null,
      shared,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
