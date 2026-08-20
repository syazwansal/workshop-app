import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/config/brand";

/** Top navigation shown on the public pages (/, /login, /signup). */
export default function BrandHeader() {
  return (
    <header className="border-b border-[#ead7c2] bg-[#fffaf3]/95">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
          style={{ color: brand.primaryColor }}
        >
          <Image src={brand.logo} alt={`${brand.name} logo`} width={28} height={28} />
          {brand.name}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="rounded-md px-3 py-1.5 text-[#6f5a48] hover:text-[#2d2018]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md px-3 py-1.5 font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
