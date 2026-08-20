"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function StaffHeader({
  userEmail,
  isAdmin = false,
  subtitle,
}: {
  userEmail: string;
  isAdmin?: boolean;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const initial = userEmail.trim().charAt(0).toUpperCase() || "S";
  const inAdmin = pathname === "/admin";

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-[#ead7c2] bg-[#fffaf3]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/app" className="flex items-center gap-2 text-lg font-semibold text-[#11895b]">
          <Image src={brand.logo} alt={`${brand.name} logo`} width={30} height={30} />
          <span>{brand.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="grid grid-cols-2 rounded-full border border-[#11895b] bg-[#11895b] p-1 text-sm font-semibold shadow-sm">
              <Link
                href="/app"
                className={`rounded-full px-4 py-1.5 text-center ${
                  inAdmin
                    ? "text-white hover:bg-white/10"
                    : "bg-white text-[#11895b] shadow-sm"
                }`}
              >
                Order
              </Link>
              <Link
                href="/admin"
                className={`rounded-full px-4 py-1.5 text-center ${
                  inAdmin
                    ? "bg-white text-[#11895b] shadow-sm"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Admin
              </Link>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full border border-[#e3cdb6] bg-white py-1 pl-1 pr-3 text-sm font-semibold text-[#5f4a3a] hover:bg-[#fff1df]"
              aria-expanded={open}
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#11895b] text-white">
                {initial}
              </span>
              <span className="hidden max-w-44 truncate sm:inline">{userEmail}</span>
            </button>

            {open && (
              <div
                className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-[#ead7c2] bg-white py-2 text-sm shadow-lg"
                role="menu"
              >
                <div className="border-b border-[#ead7c2] px-4 py-2 text-xs text-[#7a6656]">
                  <p className="truncate font-semibold text-[#2d2018]">{userEmail}</p>
                  {subtitle && <p className="mt-1">{subtitle}</p>}
                </div>
                <Link
                  href="/app"
                  className="block px-4 py-2 text-[#5f4a3a] hover:bg-[#fff1df]"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Order
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-[#5f4a3a] hover:bg-[#fff1df]"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-red-700 hover:bg-red-50"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
