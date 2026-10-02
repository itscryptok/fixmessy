import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Fix Messy",
  description:
    "Fix Messy privacy policy: what we collect, how gallery consent works, and what we never store.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main>
      <h1 className="page-title">Privacy Policy</h1>
      <p className="gallery-sub">Last updated: October 2026</p>

      <div className="card">
        <h3>1. Photos you upload</h3>
        <p className="guide">
          When you analyze a space, your photo is sent to our server and to
          our AI provider (OpenAI) to generate the reorganized image, guide,
          and shopping list.
        </p>
        <p className="guide" style={{ marginTop: 10 }}>
          <strong>Your photo is stored only if you tap &ldquo;Yes,
          Share.&rdquo;</strong> In that case the before/after pair is saved
          and may appear publicly in the Photo Gallery. If you tap &ldquo;No
          Thanks,&rdquo; your photo is processed for your result and never
          uploaded or stored.
        </p>
      </div>

      <div className="card">
        <h3>2. What we don&apos;t collect</h3>
        <p className="guide">
          Fix Messy has no user accounts. We don&apos;t ask for or store your
          name, email address, or phone number. We don&apos;t run advertising
          trackers or analytics profiles on you.
        </p>
      </div>

      <div className="card">
        <h3>3. Admin access</h3>
        <p className="guide">
          The site administrator signs in with a password. We store only a
          one-way cryptographic hash of that password — never the password
          itself — plus an essential session cookie that keeps the admin
          signed in.
        </p>
      </div>

      <div className="card">
        <h3>4. Third parties</h3>
        <p className="guide">
          <strong>OpenAI</strong> processes uploaded photos to produce
          analysis and images, under OpenAI&apos;s own policies.
          <strong> Retailers</strong> you visit via &ldquo;Buy now&rdquo;
          links operate under their own privacy policies.
        </p>
      </div>

      <div className="card">
        <h3>5. Your choices</h3>
        <p className="guide">
          Don&apos;t want a photo in the gallery? Simply choose &ldquo;No
          Thanks&rdquo; when asked. To request removal of a shared gallery
          photo, contact us at{" "}
          <a href="mailto:itscryptok@gmail.com">itscryptok@gmail.com</a> and
          we&apos;ll take it down.
        </p>
      </div>

      <div className="card">
        <h3>6. Children</h3>
        <p className="guide">
          Fix Messy is not directed at children under 13, and we don&apos;t
          knowingly collect their information.
        </p>
      </div>

      <div className="card">
        <h3>7. Contact</h3>
        <p className="guide">
          Questions about this policy:{" "}
          <a href="mailto:itscryptok@gmail.com">itscryptok@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
