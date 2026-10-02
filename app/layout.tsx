import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "FixMessy";
const TAGLINE = "Space management solution";
const DESCRIPTION =
  "FixMessy — space management solution. Upload a photo of a messy room, car, or desk and get an AI-reorganized image, a practical step-by-step guide, and a shopping list of organizing products. Or get a decor style suggestion.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${TAGLINE}`,
  description: DESCRIPTION,
  metadataBase: new URL(process.env.APP_URL || "https://fixmessy.onrender.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FixMessy — Space management solution" }],
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
  themeColor: "#0d7d74",
};

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
          <a className="brand" href="/">
            <span className="brand-mark">F</span>
            <span>
              <span className="brand-name">FixMessy</span>
              <div className="brand-tag">Space management solution</div>
            </span>
          </a>
          <nav className="nav-links">
            <a href="/gallery">Photo Gallery</a>
          </nav>
        </header>
        {children}
        <footer className="site">FixMessy — Space management solution · {new Date().getFullYear()}</footer>
      </body>
    </html>
  );
}
