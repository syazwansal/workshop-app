import { redirect } from "next/navigation";
import BackendNotConnected from "@/components/BackendNotConnected";
import BrandHeader from "@/components/BrandHeader";
import ProfileClient from "@/components/ProfileClient";
import type { Profile } from "@/lib/food/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function fallbackProfile(userId: string, userEmail: string): Profile {
  return {
    id: userId,
    email: userEmail,
    full_name: "",
    phone: "",
    role: "customer",
  };
}

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#fff8ef]">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Profile</h1>
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

  const userEmail = user.email ?? "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  const initialProfile = (profile as Profile | null) ?? fallbackProfile(user.id, userEmail);

  return (
    <ProfileClient
      initialProfile={initialProfile}
      userId={user.id}
      userEmail={userEmail}
    />
  );
}
