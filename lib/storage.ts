import { promises as fs } from "fs";
import path from "path";
import { ensureSchema, getPool } from "./db";

export type GalleryMode = "reorganize" | "decor";

export interface GalleryPair {
  id: string;
  mode: GalleryMode;
  createdAt: string;
  hasAfter: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_JSON = path.join(DATA_DIR, "gallery.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const SETTINGS_JSON = path.join(DATA_DIR, "settings.json");
const PRODUCTS_JSON = path.join(DATA_DIR, "products.json");
const ADMIN_JSON = path.join(DATA_DIR, "admin.json");

const useDb = () => getPool() !== null;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureDisk() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file: string, value: unknown) {
  await ensureDisk();
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

// ---------- Gallery ----------

export async function saveGalleryPair(opts: {
  mode: GalleryMode;
  before: Buffer;
  after: Buffer | null;
  mimeBefore: string;
  mimeAfter: string | null;
}): Promise<string> {
  const id = newId();
  if (useDb()) {
    await ensureSchema();
    await getPool()!.query(
      `INSERT INTO gallery_entry (id, mode, before_img, after_img, mime_before, mime_after)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, opts.mode, opts.before, opts.after, opts.mimeBefore, opts.mimeAfter]
    );
    return id;
  }
  await ensureDisk();
  await fs.writeFile(path.join(UPLOAD_DIR, `${id}.before`), opts.before);
  if (opts.after) await fs.writeFile(path.join(UPLOAD_DIR, `${id}.after`), opts.after);
  const list = await readJsonFile<GalleryPair[]>(GALLERY_JSON, []);
  list.unshift({ id, mode: opts.mode, createdAt: new Date().toISOString(), hasAfter: !!opts.after });
  await writeJsonFile(GALLERY_JSON, list);
  return id;
}

export async function listGalleryPairs(): Promise<GalleryPair[]> {
  if (useDb()) {
    await ensureSchema();
    const { rows } = await getPool()!.query(
      `SELECT id, mode, created_at, (after_img IS NOT NULL) AS has_after
       FROM gallery_entry ORDER BY created_at DESC`
    );
    return rows.map((r: any) => ({
      id: r.id,
      mode: r.mode as GalleryMode,
      createdAt: new Date(r.created_at).toISOString(),
      hasAfter: !!r.has_after,
    }));
  }
  return readJsonFile<GalleryPair[]>(GALLERY_JSON, []);
}

export async function getGalleryImage(
  id: string,
  which: "before" | "after"
): Promise<{ data: Buffer; mime: string } | null> {
  if (useDb()) {
    await ensureSchema();
    const { rows } = await getPool()!.query(`SELECT * FROM gallery_entry WHERE id = $1`, [id]);
    const row = rows[0];
    if (!row) return null;
    if (which === "before") return { data: Buffer.from(row.before_img), mime: row.mime_before };
    if (!row.after_img) return null;
    return { data: Buffer.from(row.after_img), mime: row.mime_after ?? "image/png" };
  }
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, `${id}.${which}`));
    const list = await readJsonFile<any[]>(GALLERY_JSON, []);
    const meta = list.find((m) => m.id === id);
    const mime = which === "before" ? meta?.mimeBefore ?? "image/jpeg" : meta?.mimeAfter ?? "image/png";
    return { data, mime };
  } catch {
    return null;
  }
}

// ---------- Products & settings ----------

export interface ProductRecord {
  id: string;
  name: string;
  popularity: number;
  purchaseUrl: string | null;
}

export async function upsertRecommendedProduct(name: string): Promise<ProductRecord> {
  const clean = name.trim().slice(0, 120);
  if (!clean) throw new Error("empty product name");
  if (useDb()) {
    await ensureSchema();
    const { rows } = await getPool()!.query(
      `INSERT INTO product (id, name, popularity) VALUES ($1, $2, 1)
       ON CONFLICT (name) DO UPDATE SET popularity = product.popularity + 1
       RETURNING id, name, popularity, purchase_url`,
      [newId(), clean]
    );
    const r = rows[0];
    return { id: r.id, name: r.name, popularity: r.popularity, purchaseUrl: r.purchase_url };
  }
  const list = await readJsonFile<ProductRecord[]>(PRODUCTS_JSON, []);
  const existing = list.find((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (existing) {
    existing.popularity += 1;
    await writeJsonFile(PRODUCTS_JSON, list);
    return existing;
  }
  const rec: ProductRecord = { id: newId(), name: clean, popularity: 1, purchaseUrl: null };
  list.push(rec);
  await writeJsonFile(PRODUCTS_JSON, list);
  return rec;
}

export async function listProducts(sort: "popularity" | "name"): Promise<ProductRecord[]> {
  let list: ProductRecord[];
  if (useDb()) {
    await ensureSchema();
    const order = sort === "popularity" ? "popularity DESC" : "name ASC";
    const { rows } = await getPool()!.query(`SELECT id, name, popularity, purchase_url FROM product ORDER BY ${order}`);
    list = rows.map((r: any) => ({ id: r.id, name: r.name, popularity: r.popularity, purchaseUrl: r.purchase_url }));
  } else {
    list = await readJsonFile<ProductRecord[]>(PRODUCTS_JSON, []);
    list.sort((a, b) => (sort === "popularity" ? b.popularity - a.popularity : a.name.localeCompare(b.name)));
  }
  return list;
}

export async function setProductUrl(id: string, purchaseUrl: string | null): Promise<void> {
  const clean = purchaseUrl?.trim() ? purchaseUrl!.trim().slice(0, 500) : null;
  if (useDb()) {
    await ensureSchema();
    const { rowCount } = await getPool()!.query(`UPDATE product SET purchase_url = $1 WHERE id = $2`, [clean, id]);
    if (!rowCount) throw new Error("product not found");
    return;
  }
  const list = await readJsonFile<ProductRecord[]>(PRODUCTS_JSON, []);
  const rec = list.find((p) => p.id === id);
  if (!rec) throw new Error("product not found");
  rec.purchaseUrl = clean;
  await writeJsonFile(PRODUCTS_JSON, list);
}

export async function getSetting(key: string): Promise<string | null> {
  if (useDb()) {
    await ensureSchema();
    const { rows } = await getPool()!.query(`SELECT value FROM setting WHERE key = $1`, [key]);
    return rows[0]?.value ?? null;
  }
  const map = await readJsonFile<Record<string, string>>(SETTINGS_JSON, {});
  return map[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (useDb()) {
    await ensureSchema();
    await getPool()!.query(
      `INSERT INTO setting (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
    return;
  }
  const map = await readJsonFile<Record<string, string>>(SETTINGS_JSON, {});
  map[key] = value;
  await writeJsonFile(SETTINGS_JSON, map);
}

export async function getAdminPasswordHash(): Promise<string | null> {
  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;
  if (useDb()) {
    await ensureSchema();
    const { rows } = await getPool()!.query(`SELECT password_hash FROM admin_credential WHERE id = 'admin'`);
    return rows[0]?.password_hash ?? null;
  }
  const obj = await readJsonFile<{ passwordHash?: string }>(ADMIN_JSON, {});
  return obj.passwordHash ?? null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  if (useDb()) {
    await ensureSchema();
    await getPool()!.query(
      `INSERT INTO admin_credential (id, password_hash) VALUES ('admin', $1)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [hash]
    );
    return;
  }
  await writeJsonFile(ADMIN_JSON, { passwordHash: hash });
}
