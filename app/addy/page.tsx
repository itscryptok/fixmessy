"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  popularity: number;
  purchaseUrl: string | null;
}

type Sort = "popularity" | "name";

export default function AddyPage() {
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<Sort>("popularity");
  const [defaultUrl, setDefaultUrl] = useState("");
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({});
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((j) => setSetupNeeded(!!j.setupNeeded))
      .catch(() => setSetupNeeded(false));
  }, []);

  async function loadData(nextSort: Sort) {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/admin/products?sort=${nextSort}`),
        fetch("/api/admin/settings"),
      ]);
      if (pRes.status === 401 || sRes.status === 401) {
        setAuthed(false);
        return;
      }
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      setProducts(pJson.products ?? []);
      setDefaultUrl(sJson.defaultUrl ?? "");
      const drafts: Record<string, string> = {};
      (pJson.products ?? []).forEach((p: Product) => {
        drafts[p.id] = p.purchaseUrl ?? "";
      });
      setDraftUrls(drafts);
    } catch {
      setError("Could not load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) loadData(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not set the password.");
      setSetupNeeded(false);
      setAuthed(true);
      setPassword("");
      setConfirm("");
    } catch (e: any) {
      setError(e?.message || "Could not set the password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Login failed.");
      setAuthed(true);
      setPassword("");
    } catch (e: any) {
      setError(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    setAuthed(false);
    setProducts([]);
  }

  async function saveProductUrl(id: string) {
    setError(null);
    setSavedMsg(null);
    const value = (draftUrls[id] ?? "").trim();
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, purchaseUrl: value || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not save.");
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, purchaseUrl: value || null } : p)));
      setSavedMsg("Purchase URL saved.");
    } catch (e: any) {
      setError(e?.message || "Could not save.");
    }
  }

  async function saveDefaultUrl() {
    setError(null);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultUrl: defaultUrl.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not save.");
      setSavedMsg("Default purchase URL saved.");
    } catch (e: any) {
      setError(e?.message || "Could not save.");
    }
  }

  if (setupNeeded === null) {
    return (
      <main>
        <div className="empty-state"><div className="big">…</div><p>Loading…</p></div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main>
        <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
          <h2 className="page-title" style={{ marginTop: 0, fontSize: 30 }}>Admin Access</h2>
          {setupNeeded ? (
            <>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>
                No admin password exists yet. Create one now — only you will know it.
              </p>
              <form onSubmit={handleSetup}>
                <div className="field">
                  <label htmlFor="pw">New password (min. 8 characters)</label>
                  <input id="pw" className="input" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                </div>
                <div className="field">
                  <label htmlFor="pw2">Confirm password</label>
                  <input id="pw2" className="input" type="password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
                </div>
                {error && <div className="notice notice-error">{error}</div>}
                <button className="pill pill-dark" type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Set Password"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>Enter the admin password to continue.</p>
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="pw">Password</label>
                  <input id="pw" className="input" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                </div>
                {error && <div className="notice notice-error">{error}</div>}
                <button className="pill pill-dark" type="submit" disabled={busy}>
                  {busy ? "Signing in…" : "Sign In"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ margin: "6px 0" }}>Admin Dashboard</h1>
        <button className="btn-sm btn-sm-light" type="button" onClick={handleLogout}>Sign Out</button>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {savedMsg && <div className="notice notice-info">{savedMsg}</div>}

      <div className="card">
        <h3>Default purchase URL</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Used for any suggested product that has no individual purchase URL.
        </p>
        <div className="field">
          <input
            className="input"
            type="url"
            placeholder="https://…"
            value={defaultUrl}
            onChange={(e) => setDefaultUrl(e.target.value)}
          />
        </div>
        <button className="btn-sm" type="button" onClick={saveDefaultUrl}>
          Save Default URL
        </button>
      </div>

      <div className="card">
        <h3>Suggested products</h3>
        <div className="toolbar">
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Sort by:</span>
          <button
            className={`chip ${sort === "popularity" ? "active" : ""}`}
            type="button"
            onClick={() => { setSort("popularity"); loadData("popularity"); }}
          >
            Popularity
          </button>
          <button
            className={`chip ${sort === "name" ? "active" : ""}`}
            type="button"
            onClick={() => { setSort("name"); loadData("name"); }}
          >
            Name
          </button>
        </div>
        {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}
        {!loading && products.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            No products suggested yet. They appear here automatically each time the AI recommends them.
          </p>
        )}
        {products.map((p) => (
          <div className="product-row" key={p.id}>
            <div className="pname">
              {p.name}
              <div className="pop">Suggested {p.popularity}×</div>
            </div>
            <input
              className="input"
              type="url"
              placeholder="Purchase URL (https://…)"
              value={draftUrls[p.id] ?? ""}
              onChange={(e) => setDraftUrls((d) => ({ ...d, [p.id]: e.target.value }))}
            />
            <button className="btn-sm" type="button" onClick={() => saveProductUrl(p.id)}>
              Save
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
