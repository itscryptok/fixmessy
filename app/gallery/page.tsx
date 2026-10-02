"use client";

import { useCallback, useEffect, useState } from "react";
import type { GalleryPair } from "@/lib/types";

interface FlatImage {
  pairId: string;
  which: "before" | "after";
  mode: string;
  label: string;
  src: string;
}

function imgSrc(pairId: string, which: "before" | "after") {
  return `/api/gallery/image?id=${encodeURIComponent(pairId)}&which=${which}`;
}

export default function GalleryPage() {
  const [pairs, setPairs] = useState<GalleryPair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Could not load the gallery.");
        setPairs(json.pairs ?? []);
      })
      .catch((e: any) => setError(e?.message || "Could not load the gallery. Please try again."))
      .finally(() => {});
  }, []);

  const flat: FlatImage[] = (pairs ?? []).flatMap((p) => {
    const imgs: FlatImage[] = [
      { pairId: p.id, which: "before", mode: p.mode, label: `Before — ${p.mode === "reorganize" ? "Reorganized" : "Decor"}`,
        src: imgSrc(p.id, "before") },
    ];
    if (p.hasAfter) {
      imgs.push({
        pairId: p.id, which: "after", mode: p.mode,
        label: `After — ${p.mode === "reorganize" ? "Reorganized" : "Decor"}`,
        src: imgSrc(p.id, "after"),
      });
    }
    return imgs;
  });

  const step = useCallback(
    (dir: 1 | -1) => {
      setViewerIndex((i) => {
        if (i === null || flat.length === 0) return i;
        return (i + dir + flat.length) % flat.length;
      });
    },
    [flat.length]
  );

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerIndex, step]);

  return (
    <main>
      <h2 style={{ margin: "6px 0 2px" }}>Photo Gallery</h2>
      <p style={{ color: "var(--muted)", marginTop: 0, fontSize: 15 }}>
        Before-and-after transformations shared by FixMessy users.
      </p>

      {error && (
        <div className="card">
          <div className="notice notice-error" role="alert">{error}</div>
          <button className="btn btn-block" type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {!error && pairs === null && (
        <div className="empty-state" role="status">
          <div className="big">…</div>
          <p>Loading the gallery…</p>
        </div>
      )}

      {!error && pairs !== null && pairs.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="big">🖼️</div>
            <p>No shared photos yet. Be the first — analyze a space and tap “Yes, Share”.</p>
          </div>
        </div>
      )}

      {!error && pairs !== null && pairs.length > 0 && (
        <div className="gallery-grid">
          {pairs.map((p, pi) => (
            <div
              className="gallery-card"
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`${p.mode === "reorganize" ? "Reorganized" : "Decor"} pair ${pi + 1}`}
              onClick={() => setViewerIndex(flat.findIndex((f) => f.pairId === p.id && f.which === "before"))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setViewerIndex(flat.findIndex((f) => f.pairId === p.id && f.which === "before"));
                }
              }}
            >
              <div className="pair">
                <img src={imgSrc(p.id, "before")} alt="Before" loading="lazy" />
                {p.hasAfter ? (
                  <img src={imgSrc(p.id, "after")} alt="After" loading="lazy" />
                ) : (
                  <div style={{ background: "var(--teal-soft)" }} />
                )}
              </div>
              <div className="cap">
                <span className={`badge ${p.mode === "reorganize" ? "badge-reorganize" : "badge-decor"}`} style={{ margin: 0 }}>
                  {p.mode === "reorganize" ? "Reorganized" : "Decor"}
                </span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerIndex !== null && flat[viewerIndex] && (
        <div className="viewer-backdrop" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button className="viewer-close" type="button" aria-label="Close viewer" onClick={() => setViewerIndex(null)}>
            ✕
          </button>
          <button className="viewer-btn viewer-prev" type="button" aria-label="Previous image" onClick={() => step(-1)}>
            ‹
          </button>
          <img className="viewer-img" src={flat[viewerIndex].src} alt={flat[viewerIndex].label} />
          <div className="viewer-cap">
            {flat[viewerIndex].label} · {viewerIndex + 1} of {flat.length}
          </div>
          <button className="viewer-btn viewer-next" type="button" aria-label="Next image" onClick={() => step(1)}>
            ›
          </button>
        </div>
      )}
    </main>
  );
}
