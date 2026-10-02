// Server-side AI calls. Never called from the client — all requests go
// through /api/analyze, which runs here on the server.

export interface ShoppingItem {
  name: string;
  price: number;
  quantity: number;
}

export interface AnalysisResult {
  tidy: boolean;
  guide: string;
  items: ShoppingItem[];
  suggestion: string | null;
}

const OPENAI_API = "https://api.openai.com/v1";
const VISION_MODEL = process.env.FIXMESSY_VISION_MODEL || "gpt-4o";
const IMAGE_MODEL = process.env.FIXMESSY_IMAGE_MODEL || "gpt-image-1";

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "AI is not configured yet (OPENAI_API_KEY is missing). Ask the site owner to add it."
    );
  }
  return key;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

const RESPONSE_SCHEMA_HINT = `Return ONLY valid JSON with this shape:
{
  "tidy": boolean,
  "guide": "string",
  "items": [{"name": "string", "price": number, "quantity": number}],
  "suggestion": "string or null"
}`;

const REORGANIZE_SYSTEM = `You are FixMessy, a practical home-organization assistant. Look at the exact photo the user uploaded and make a restrained, honest assessment. Do NOT invent mess that is not visible and do NOT force changes.

- If the space is already tidy or there is nothing meaningful to fix: set "tidy" to true, write a brief positive guide saying the space already looks good, return an empty items array, and null suggestion. Never invent products for a tidy space.
- If changes are genuinely useful: set "tidy" to false and recommend only a SMALL number (1-5) of genuinely appropriate organizing products visible-context appropriate (bins, baskets, drawer dividers, cable organizers, shelf risers, hooks, labels, etc.). Use realistic generic product names (no brand names), realistic estimated USD prices, and sensible quantities.
- The guide must be specific to what is visible in the photo: name the areas and items you see, and give step-by-step actions in order.
- "suggestion" is optional: only include it when you have something genuinely useful to flag (e.g. a safety issue, a better layout idea). Otherwise null.
${RESPONSE_SCHEMA_HINT}`;

const DECOR_SYSTEM = `You are FixMessy, a tasteful interior-styling assistant. This is STYLING, not organizing: do not recommend bins, baskets, storage products, or any decluttering/rearranging of existing items. Recommend only tasteful decor appropriate to the room type and the space visible in the photo (e.g. wall art, throw pillows, a plant, a lamp, a rug, curtains — matched to the room's colors and style). Recommend a SMALL number (1-5) of items with realistic generic product names (no brand names), realistic estimated USD prices, and sensible quantities. Write a concise guide explaining each styling choice and why it suits this space. "suggestion" is optional and only for something genuinely useful; otherwise null.
${RESPONSE_SCHEMA_HINT}`;

export async function analyzePhoto(
  image: Buffer,
  mime: string,
  mode: "reorganize" | "decor"
): Promise<AnalysisResult> {
  const key = requireKey();
  const base64 = image.toString("base64");
  const res = await fetchWithTimeout(
    `${OPENAI_API}/chat/completions`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: mode === "reorganize" ? REORGANIZE_SYSTEM : DECOR_SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: mode === "reorganize" ? "Assess this space for reorganization." : "Suggest a decor style for this space." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
        max_tokens: 1500,
      }),
    },
    90000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI analysis failed (${res.status}). ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as any;
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI analysis returned invalid data. Please try again.");
  }
  if (typeof parsed.tidy !== "boolean" || typeof parsed.guide !== "string" || !Array.isArray(parsed.items)) {
    throw new Error("AI analysis returned invalid data. Please try again.");
  }
  const items: ShoppingItem[] = parsed.items
    .filter((i: any) => i && typeof i.name === "string" && i.name.trim())
    .slice(0, 8)
    .map((i: any) => ({
      name: String(i.name).trim().slice(0, 120),
      price: Number.isFinite(Number(i.price)) ? Math.max(0, Number(i.price)) : 0,
      quantity: Number.isFinite(Number(i.quantity)) && Number(i.quantity) > 0 ? Math.round(Number(i.quantity)) : 1,
    }));
  return {
    tidy: parsed.tidy,
    guide: parsed.guide.slice(0, 4000),
    items: parsed.tidy ? [] : items,
    suggestion:
      typeof parsed.suggestion === "string" && parsed.suggestion.trim()
        ? parsed.suggestion.trim().slice(0, 1000)
        : null,
  };
}

export async function generateEditedImage(
  image: Buffer,
  mime: string,
  mode: "reorganize" | "decor",
  guide: string
): Promise<{ data: Buffer; mime: string }> {
  const key = requireKey();
  const prompt =
    mode === "reorganize"
      ? `Edit this exact photo into a neatly organized version of the SAME space. Rules: preserve the room's shape, layout, wall and floor colors, perspective, and lighting exactly. Keep every original item visible — do NOT erase, hide, or remove any clutter; instead show it neatly contained or arranged (e.g. items placed into bins, folded, stacked, aligned). Add ONLY functional organizing products (storage bins, baskets, drawer organizers, shelf dividers, cable organizers, hooks). Do NOT add decor such as plants, pillows, lamps, rugs, wall art, or decorative furniture. Photorealistic, same camera angle. Context from the organizer: ${guide.slice(0, 600)}`
      : `Restyle this exact photo with tasteful decor suited to the room. Rules: preserve the room's shape, layout, colors, and perspective exactly. Do NOT add bins or storage products, do NOT declutter, and do NOT rearrange existing items — only add or swap decorative touches (wall art, throw pillows, plant, lamp, rug, curtains) that match the room's style and palette. Photorealistic, same camera angle. Styling notes: ${guide.slice(0, 600)}`;

  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const form = new FormData();
  form.append("model", IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("image", new Blob([new Uint8Array(image)], { type: mime }), `photo.${ext}`);

  const res = await fetchWithTimeout(
    `${OPENAI_API}/images/edits`,
    { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form },
    180000
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Image generation failed (${res.status}). ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as any;
  const b64: string | undefined = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned invalid data. Please try again.");
  return { data: Buffer.from(b64, "base64"), mime: "image/png" };
}
