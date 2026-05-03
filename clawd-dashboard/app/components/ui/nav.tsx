"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Mission Control" },
  { href: "/contacts", label: "Contacts" },
  { href: "/meetings", label: "Meetings" },
  { href: "/deals", label: "Deals" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-capwide">
      {LINKS.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "border px-3 py-1.5 transition-colors",
              active
                ? "border-ember-500/60 bg-ember-500/5 text-bone-50"
                : "border-ink-700 text-bone-300 hover:border-ink-500 hover:text-bone-100"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
