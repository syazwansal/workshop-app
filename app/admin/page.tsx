import Link from "next/link";
import { redirect } from "next/navigation";
import AdminClient from "@/components/AdminClient";
import BackendNotConnected from "@/components/BackendNotConnected";
import BrandHeader from "@/components/BrandHeader";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/food/types";

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#fff8ef]">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Admin</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as Profile | null)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-lg border border-[#ead7c2] bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Admin access only</h1>
            <p className="mt-3 text-[#6f5a48]">
              Your account is set up for staff ordering. Ask an existing admin to mark
              your profile role as admin in Supabase.
            </p>
            <Link
              href="/app"
              className="mt-5 inline-block rounded-md bg-[#11895b] px-4 py-2 font-semibold text-white"
            >
              Back to staff app
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <AdminClient userEmail={user.email ?? ""} />;
}
