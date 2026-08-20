"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import BackendNotConnected from "./BackendNotConnected";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
    });
    setBusy(false);
    if (error) {
      setError("Sign-up failed. Try a different email or a longer password.");
      return;
    }
    if (data.session) {
      // Email confirmation is OFF (the workshop default) — signed in already.
      router.push("/app");
      router.refresh();
    } else {
      // Email confirmation is ON — tell the user to check their inbox.
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto mt-12 w-full max-w-sm px-4">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-[#6f5a48]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to finish
          creating your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-sm px-4">
      <h1 className="text-2xl font-bold">Create your account</h1>
      {!isSupabaseConfigured() && (
        <div className="mt-4">
          <BackendNotConnected />
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-[#ead7c2] bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e3cdb6] px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password <span className="font-normal text-[#7a6656]">(at least 8 characters)</span>
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#e3cdb6] px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md px-4 py-2 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[#6f5a48]">
        Already have an account?{" "}
        <Link href="/login" className="underline" style={{ color: brand.primaryColor }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
