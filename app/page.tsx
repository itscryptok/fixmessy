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

export default function HomePage() {
  const router = useRouter();
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [consentOpen, setConsentOpen] = useState<null | AnalyzeMode>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleFile(file: File | undefined | null) {
    setError(null);
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
    if (libraryRef.current) libraryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
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
      <section className="hero">
        <h1>FixMessy</h1>
        <p className="tagline">Space management solution</p>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {!photo ? (
        <div className="card">
          <div
            className="upload-prompt"
            role="button"
            tabIndex={0}
            onClick={() => libraryRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") libraryRef.current?.click(); }}
          >
            {reading ? "Reading your photo…" : PLACEHOLDER_PROMPT}
          </div>
          <div className="preview-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-secondary" type="button" onClick={() => libraryRef.current?.click()} disabled={reading}>
              Choose from Library
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => cameraRef.current?.click()} disabled={reading}>
              Take a Photo
            </button>
          </div>
          <input
            ref={libraryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="card">
          <div className="preview-wrap">
            <img
              src={photo.dataUrl}
              alt="Your uploaded space"
              onError={() => {
                setError("That image could not be displayed. Please choose a different photo.");
                clearPhoto();
              }}
            />
            <div className="preview-actions">
              <button className="btn-ghost btn" type="button" onClick={clearPhoto}>Remove</button>
              <button className="btn-ghost btn" type="button" onClick={() => libraryRef.current?.click()}>
                Choose Another Image
              </button>
            </div>
            <input
              ref={libraryRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="mode-buttons">
            <button
              className="btn btn-block"
              type="button"
              disabled={analyzing}
              onClick={() => setConsentOpen("reorganize")}
            >
              {analyzing ? <span className="spinner" /> : null} Reorganize This Space
            </button>
            <button
              className="btn btn-secondary btn-block"
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
        </div>
      )}

      <div className="card">
        <h3>How it works</h3>
        <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Snap a messy space. FixMessy shows you a tidied-up version, walks you through
          exactly what to do, and lists the organizing products you need — or suggests a
          fresh decor style instead.
        </p>
      </div>

      {consentOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Photo gallery consent">
          <div className="modal">
            <h2>One quick question</h2>
            <p>{CONSENT_TEXT}</p>
            <div className="modal-actions">
              <button className="btn btn-block" type="button" onClick={() => runAnalysis(consentOpen, true)}>
                Yes, Share
              </button>
              <button className="btn btn-secondary btn-block" type="button" onClick={() => runAnalysis(consentOpen, false)}>
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
