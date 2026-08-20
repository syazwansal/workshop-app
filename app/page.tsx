import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { brand } from "@/lib/config/brand";

// ─────────────────────────────────────────────────────────────
// HOMEPAGE CONTENT — safe to customize in Module 4.
// Edit the words below, or reorder the sections in SECTION_ORDER.
// ─────────────────────────────────────────────────────────────

const headline = "Keep track of the stuff that matters.";
const subcopy =
  "A private list that's yours alone. Add notes, ideas and reminders — they're saved securely and only you can see them.";

const howItWorks = [
  { title: "1. Create an account", text: "Sign up with just an email and a password." },
  { title: "2. Add your items", text: "Notes, ideas, tasks — anything you want to keep." },
  { title: "3. Come back anytime", text: "Your list is saved in the cloud, private to you." },
];

// Reorder these to change the page layout (Module 4 layout edit).
const SECTION_ORDER = ["hero", "how-it-works", "cta"] as const;

// ─────────────────────────────────────────────────────────────

type SectionId = (typeof SECTION_ORDER)[number];

const sections: Record<SectionId, React.ReactNode> = {
  hero: (
    <section key="hero" className="px-4 py-16 text-center">
      {brand.showWorkshopBadge && (
        <span className="future-pulse mb-4 inline-block rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600">
          Built at the TimeTec AI Workshop
        </span>
      )}
      <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        {headline}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">{subcopy}</p>
      <p
        className="future-sheen mt-2 bg-clip-text text-sm font-medium text-transparent"
      >
        {brand.tagline}
      </p>
    </section>
  ),
  "how-it-works": (
    <section key="how-it-works" className="px-4 py-12">
      <h2 className="text-center text-2xl font-semibold">How it works</h2>
      <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
        {howItWorks.map((step) => (
          <div key={step.title} className="rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  ),
  cta: (
    <section key="cta" className="px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold">Ready to start?</h2>
      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/signup"
          className="future-pulse rounded-md px-5 py-2.5 font-medium text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Create your account
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign in
        </Link>
      </div>
    </section>
  ),
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main>{SECTION_ORDER.map((id) => sections[id])}</main>
      <footer className="border-t border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
        {brand.name} — {brand.tagline}
      </footer>
    </div>
  );
}
