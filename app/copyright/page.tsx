import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright — Fix Messy",
  description: "Fix Messy copyright notice: site content ownership and photo rights.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <main>
      <h1 className="page-title">Copyright</h1>

      <div className="card">
        <h3>Site content</h3>
        <p className="guide">
          © {new Date().getFullYear()} Fix Messy. All rights reserved. The Fix
          Messy name, logo, design, and text on this site are the property of
          Fix Messy and may not be copied or reused without permission.
        </p>
      </div>

      <div className="card">
        <h3>Your photos</h3>
        <p className="guide">
          Photos you upload remain yours. By tapping &ldquo;Yes, Share&rdquo;
          you grant Fix Messy a non-exclusive license to display your
          before/after pair publicly in the Photo Gallery. You can request
          removal at any time via{" "}
          <a href="mailto:itscryptok@gmail.com">itscryptok@gmail.com</a>.
        </p>
      </div>

      <div className="card">
        <h3>AI-generated images</h3>
        <p className="guide">
          Reorganized or styled images produced for you by the app are provided
          for your personal use.
        </p>
      </div>
    </main>
  );
}
