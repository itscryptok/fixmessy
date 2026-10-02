"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RESULT_KEY, type AnalyzeResult } from "@/lib/types";

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function ResultsPage() {
  const [result, setResult] = useState<AnalyzeResult | null | "missing">("missing");
  const [sharedMsg, setSharedMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      setResult(raw ? (JSON.parse(raw) as AnalyzeResult) : "missing");
    } catch {
      setResult("missing");
    }
  }, []);

  async function downloadImage() {
    if (result === "missing" || !result || !result.afterImage) return;
    try {
      const a = document.createElement("a");
      a.href = result.afterImage;
      a.download = `fixmessy-${result.mode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setSharedMsg("Could not download the image on this device.");
    }
  }

  async function shareApp() {
    const url = window.location.origin;
    const data = { title: "FixMessy", text: "FixMessy — Space management solution", url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setSharedMsg("App link copied to your clipboard.");
      } else {
        setSharedMsg(url);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  if (result === "missing") {
    return (
      <main>
        <div className="card">
          <h3>No result to show</h3>
          <p style={{ color: "var(--muted)" }}>
            Your analysis result is no longer available (it lives only in this browser tab).
            Start a fresh analysis below.
          </p>
          <Link className="btn btn-block" href="/">Analyze a Photo</Link>
        </div>
      </main>
    );
  }
  if (result === null) {
    return (
      <main>
        <div className="empty-state"><div className="big">…</div><p>Loading your result…</p></div>
      </main>
    );
  }

  const isReorg = result.mode === "reorganize";
  const total = result.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <main>
      <span className={`badge ${isReorg ? "badge-reorganize" : "badge-decor"}`}>
        {isReorg ? "Reorganized" : "Decor suggestion"}
      </span>
      <h2 style={{ margin: "0 0 4px" }}>
        {isReorg ? "Your reorganized space" : "Your new decor style"}
      </h2>
      {result.shared && (
        <div className="notice notice-info">Thanks — your before/after pair was added to the Photo Gallery.</div>
      )}

      {result.afterImage ? (
        <div className="card">
          <div className="compare">
            <figure>
              <img src={result.beforeImage} alt="Original photo of your space" />
              <figcaption>Before</figcaption>
            </figure>
            <figure>
              <img src={result.afterImage} alt={isReorg ? "AI-reorganized version of your space" : "AI-styled version of your space"} />
              <figcaption>After</figcaption>
            </figure>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="compare">
            <figure>
              <img src={result.beforeImage} alt="Original photo of your space" />
              <figcaption>Your photo</figcaption>
            </figure>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{isReorg ? "Your step-by-step guide" : "Styling guide"}</h3>
        <div className="guide">{result.guide}</div>
        {result.suggestion && <div className="suggestion"><strong>Suggestion:</strong> {result.suggestion}</div>}
      </div>

      {result.items.length > 0 && (
        <div className="card">
          <h3>Shopping list</h3>
          {result.items.map((item, idx) => (
            <div className="shop-item" key={idx}>
              <div>
                <div className="name">{item.name}</div>
                <div className="meta">{money(item.price)} × {item.quantity} = {money(item.price * item.quantity)}</div>
              </div>
              {item.url ? (
                <a className="btn btn-secondary buy" href={item.url} target="_blank" rel="noopener noreferrer" style={{ minHeight: 44, padding: "10px 16px", fontSize: 14 }}>
                  Buy now
                </a>
              ) : null}
            </div>
          ))}
          <div style={{ textAlign: "right", fontWeight: 700, marginTop: 10 }}>
            Estimated total: {money(total)}
          </div>
        </div>
      )}

      {sharedMsg && <div className="notice notice-info">{sharedMsg}</div>}

      <div className="result-actions">
        {result.afterImage && (
          <button className="btn btn-secondary" type="button" onClick={downloadImage}>
            Save Image
          </button>
        )}
        <button className="btn btn-secondary" type="button" onClick={shareApp}>
          Share FixMessy
        </button>
        <Link className="btn" href="/" style={{ gridColumn: "1 / -1" }}>
          Analyze Another Photo
        </Link>
      </div>
    </main>
  );
}
