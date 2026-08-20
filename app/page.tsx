import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { brand } from "@/lib/config/brand";

const highlights = [
  "Office delivery for busy TimeTec teams",
  "Fresh menu items grouped by breakfast, meals, noodles, and drinks",
  "Live order status from kitchen prep to delivery",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <BrandHeader />
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#11895b]">
              TimeTec staff ordering
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Order warm meals to your office desk.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#6f5a48]">
              Browse the daily menu, send your delivery location, and track each order
              from received to delivered without leaving the workday flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md px-5 py-3 font-semibold text-white shadow-sm"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Start ordering
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-[#e3cdb6] bg-white px-5 py-3 font-semibold text-[#3b2a20] hover:bg-[#fff1df]"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e3cdb6] bg-white shadow-sm">
            <div className="aspect-[4/3] bg-[url('https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
            <div className="grid gap-3 p-5">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#5f4a3a]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#11895b]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
