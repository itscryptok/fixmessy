import { NextResponse } from "next/server";

const BASE = process.env.APP_URL || "https://fixmessy.onrender.com";

export async function GET() {
  const urls = ["", "/gallery", "/terms", "/privacy", "/copyright"].map(
    (p) => `  <url><loc>${BASE}${p || "/"}</loc><changefreq>weekly</changefreq><priority>${p ? "0.7" : "1.0"}</priority></url>`
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
