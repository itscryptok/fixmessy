"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RESULT_KEY, type AnalyzeMode, type AnalyzeResult } from "@/lib/types";

const PLACEHOLDER_PROMPT = "Upload a photo of your room, car, desk top or any messy space";
const CONSENT_TEXT = "Can we share your photo on our photo gallery page?";
const MAX_DIM = 1600;

function fileToResizedDataUrl(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported in this browser.");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("That image could not be read. Please try a different photo."));
            const reader = new FileReader();
            reader.onload = () => resolve({ dataUrl: String(reader.result), blob });
            reader.onerror = () => reject(new Error("That image could not be read. Please try a different photo."));
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.85
        );
      } catch (e: any) {
        reject(new Error(e?.message || "That image could not be read. Please try a different photo."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be read. Please choose a JPG, PNG, or WebP photo."));
    };
    img.src = url;
  });
}

function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="M21 15l-5-5-9 9" />
    </svg>
  );
}
function LibraryIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="14" height="12" rx="2.5" />
      <path d="M17 10l4-2v9l-4-2" />
      <circle cx="8.5" cy="10.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M5.5 16.5l4-4 3 3 2.5-2.5 2 2" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState<null | AnalyzeMode>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleFile(file: File | undefined | null) {
    setError(null);
    setSheetOpen(false);
    if (!file) return; // user cancelled the picker — not an error
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Please choose a photo file.");
      return;
    }
    setReading(true);
    try {
      const resized = await fileToResizedDataUrl(file);
      setPhoto(resized);
      setPhotoName(file.name || "photo");
    } catch (e: any) {
      setError(e?.message || "That image could not be read. Please try a different photo.");
      setPhoto(null);
    } finally {
      setReading(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoName("");
    setError(null);
    for (const r of [libraryRef, cameraRef, fileRef]) if (r.current) r.current.value = "";
  }

  async function runAnalysis(mode: AnalyzeMode, share: boolean) {
    if (!photo || analyzing) return;
    setConsentOpen(null);
    setAnalyzing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("mode", mode);
      form.append("consent", share ? "yes" : "no");
      form.append("image", photo.blob, photoName || "photo.jpg");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Analysis failed. Please try again.");
      const result = json as AnalyzeResult;
      try {
        sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      } catch {
        // sessionStorage full or unavailable — results page will show an error state
      }
      router.push("/results");
    } catch (e: any) {
      setError(e?.message || "Analysis failed. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main>
      <p className="kicker">ROOM, THEN KIT</p>
      <h1 className="hero-title">Easily transform your room or any messy space into a more organized one.</h1>
      <p className="hero-sub">No worries, we also show you the organizers to buy.</p>

      <div className="hero-pair" aria-hidden="true">
        <div className="hero-card">
          <img src="/hero-before.jpg" alt="" loading="eager" fetchPriority="high" />
        </div>
        <div className="hero-arrow">
          <ArrowIcon />
        </div>
        <div className="hero-card">
          <img src="/hero-after.jpg" alt="" loading="eager" fetchPriority="high" />
        </div>
      </div>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {!photo ? (
        <>
          <button className="pill pill-dark" type="button" onClick={() => setSheetOpen(true)} disabled={reading}>
            <ImageIcon /> {reading ? "Reading your photo…" : "Add a room photo"}
          </button>
          <p className="helper-text">{PLACEHOLDER_PROMPT}</p>
        </>
      ) : (
        <>
          <div className="preview-card">
            <img
              src={photo.dataUrl}
              alt="Your uploaded space"
              onError={() => {
                setError("That image could not be displayed. Please choose a different photo.");
                clearPhoto();
              }}
            />
            <div className="preview-meta">
              <button className="link-btn" type="button" onClick={clearPhoto}>Remove</button>
              <button className="link-btn" type="button" onClick={() => setSheetOpen(true)}>Choose another</button>
            </div>
          </div>
          <div className="pill-row">
            <button
              className="pill pill-dark"
              type="button"
              disabled={analyzing}
              onClick={() => setConsentOpen("reorganize")}
            >
              {analyzing ? <span className="spinner" /> : null} Reorganize This Space
            </button>
            <button
              className="pill pill-light"
              type="button"
              disabled={analyzing}
              onClick={() => setConsentOpen("decor")}
            >
              {analyzing ? <span className="spinner" /> : null} Suggest a Decor Style
            </button>
          </div>
          {analyzing && (
            <div className="notice notice-info" role="status">
              Analyzing your photo… this can take up to a minute.
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="text-btn" type="button" onClick={clearPhoto}>Cancel</button>
          </div>
        </>
      )}

      {!photo && (
        <div className="pill-row">
          <a className="pill pill-light" href="/gallery">
            <GridIcon /> View gallery
          </a>
        </div>
      )}

      <div className="card how-card">
        <h3>How it works</h3>
        <p>
          Add a photo of your desktop, table, desk, car interior, room, or any
          messy space — and let Fix Messy reorganize it to suit your taste.
        </p>
        <p style={{ marginTop: 10 }}>
          Snap the mess, get a tidied-up version, a step-by-step guide, and the
          organizers to buy — or a fresh decor style instead.
        </p>
      </div>

      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />

      {sheetOpen && (
        <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} role="dialog" aria-modal="true" aria-label="Choose photo source">
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <button className="sheet-row" type="button" onClick={() => libraryRef.current?.click()}>
              <LibraryIcon /> Photo Library
            </button>
            <button className="sheet-row" type="button" onClick={() => cameraRef.current?.click()}>
              <CameraIcon /> Take Photo
            </button>
            <button className="sheet-row" type="button" onClick={() => fileRef.current?.click()}>
              <FolderIcon /> Choose File
            </button>
          </div>
        </div>
      )}

      {consentOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Photo gallery consent">
          <div className="modal">
            <h2>One quick question</h2>
            <p>{CONSENT_TEXT}</p>
            <div className="modal-actions">
              <button className="pill pill-dark" type="button" onClick={() => runAnalysis(consentOpen, true)}>
                Yes, Share
              </button>
              <button className="pill pill-light" type="button" onClick={() => runAnalysis(consentOpen, false)}>
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
