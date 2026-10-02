# FixMessy — Space management solution

Mobile-friendly web app: upload a photo of a messy space and get an AI-reorganized
image (or a decor style suggestion), a practical step-by-step guide, and a shopping
list with purchase links. Includes an opt-in public photo gallery and a password-only
admin panel at `/addy` for managing product purchase URLs.

## Stack

- Next.js 15 + TypeScript, plain CSS (mobile-first, responsive)
- AI via OpenAI (server-side only): vision analysis + image editing
- Storage: Postgres (`bytea` images, auto-migrated at startup) with local-disk
  fallback under `./data/` when `DATABASE_URL` is unset

## Quick start

```bash
cp .env.example .env.local   # then fill in values
npm install
npm run dev
```

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | prod | Postgres connection (Render Internal Database URL). Unset = local disk storage. |
| `OPENAI_API_KEY` | yes | Powers photo analysis + image generation. |
| `APP_URL` | yes | Public URL (canonical links, sitemap, OG). |
| `FIXMESSY_VISION_MODEL` | no | Default `gpt-4o`. |
| `FIXMESSY_IMAGE_MODEL` | no | Default `gpt-image-1`. |
| `ADMIN_PASSWORD_HASH` | no | Pre-set bcrypt hash for /addy. If unset, create the password on first visit to /addy. |

## Deploy (Render)

Free web service sharing an existing paid Postgres (DynaSleepy pattern):

- Build: `npm install && npm run build` · Start: `npm start`
- Env: `DATABASE_URL` (Internal Database URL), `OPENAI_API_KEY`, `APP_URL`
- After first deploy, open `/addy` and create the admin password (only the bcrypt
  hash is stored). Then add product purchase URLs + the default purchase URL.

## Key behaviors

- Gallery consent dialog: “Yes, Share” saves the before/after pair **only** when an
  after image was generated; “No Thanks” never uploads. Either choice continues.
- Reorganize mode is restrained: tidy spaces get a positive guide, no image, empty list.
- Decor mode is styling only: no bins/storage, no decluttering, no rearranging.
- Product records are consistent by name with a popularity counter; shopping items
  attach the per-product URL or the default URL.
