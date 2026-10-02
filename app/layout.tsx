import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "Fix Messy";
const TAGLINE = "Space management solution";
const DESCRIPTION =
  "Fix Messy — space management solution. Easily transform your room or any messy space into a more organized one. Upload a photo and get an AI-reorganized image, a practical step-by-step guide, and the organizers to buy.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${TAGLINE}`,
  description: DESCRIPTION,
  metadataBase: new URL(process.env.APP_URL || "https://fixmessy.onrender.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Fix Messy — Space management solution" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e4",
};

function GridIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <header className="brand-bar">
          <a className="brand" href="/" aria-label="Fix Messy home">
            <img className="brand-mark" src="/logo-mark.svg" alt="" />
            <span className="brand-name">Fix Messy</span>
          </a>
          <nav className="nav-icons">
            <a className="nav-icon" href="/gallery" aria-label="Photo gallery">
              <GridIcon />
            </a>
          </nav>
        </header>
        {children}
        <footer className="site">
          <div className="fbrand">Fix Messy</div>
          <div>Space management solution · {new Date().getFullYear()}</div>
        </footer>
      </body>
    </html>
  );
}
