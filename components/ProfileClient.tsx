"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/food/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import StaffHeader from "./StaffHeader";

export default function ProfileClient({
  initialProfile,
  userId,
  userEmail,
}: {
  initialProfile: Profile;
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: userEmail,
        full_name: profile.full_name?.trim() || null,
        phone: profile.phone?.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError("Could not save your profile. Please try again.");
      return;
    }
    setMessage("Profile saved. You can continue ordering.");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <StaffHeader userEmail={userEmail} isAdmin={profile.role === "admin"} />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[0.8fr_1fr]">
        <section className="rounded-lg border border-[#ead7c2] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#11895b]">
            Staff profile
          </p>
          <h1 className="mt-2 text-3xl font-bold">Delivery details</h1>
          <p className="mt-3 text-[#6f5a48]">
            Keep your name and phone number here so every office food order has the
            right contact details.
          </p>
          <div className="mt-6 rounded-md bg-[#fff8ef] p-4 text-sm text-[#6f5a48]">
            <p className="font-semibold text-[#2d2018]">Signed in as</p>
            <p className="mt-1 break-words">{userEmail}</p>
            <p className="mt-3 font-semibold text-[#2d2018]">Access</p>
            <p className="mt-1 capitalize">{profile.role}</p>
          </div>
        </section>

        <form onSubmit={handleSave} className="rounded-lg border border-[#ead7c2] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Profile information</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="profile-name"
                value={profile.full_name ?? ""}
                onChange={(event) => setProfile({ ...profile, full_name: event.target.value })}
                className="mt-1 w-full rounded-md border border-[#e3cdb6] px-3 py-2"
                placeholder="e.g. Muhammad Syazwan"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium">
                Phone number
              </label>
              <input
                id="profile-phone"
                value={profile.phone ?? ""}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                className="mt-1 w-full rounded-md border border-[#e3cdb6] px-3 py-2"
                placeholder="e.g. 012-345 6789"
              />
            </div>

            {(message || error) && (
              <p className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {error ?? message}
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-[#ead7c2] pt-5">
              <button disabled={saving} className="rounded-md bg-[#11895b] px-5 py-2.5 font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save profile"}
              </button>
              <Link href="/app" className="rounded-md border border-[#e3cdb6] px-5 py-2.5 font-semibold text-[#5f4a3a] hover:bg-[#fff1df]">
                Back to menu
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
