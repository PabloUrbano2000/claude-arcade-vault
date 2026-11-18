"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useSession } from "@/components/session-provider";

type Section = "inicio" | "biblioteca" | "salon" | "about" | "auth";

function activeSection(pathname: string): Section | null {
  if (pathname === "/") return "inicio";
  if (pathname === "/games" || pathname.startsWith("/juegos/")) return "biblioteca";
  if (pathname.startsWith("/salon-de-la-fama")) return "salon";
  if (pathname === "/about") return "about";
  if (pathname.startsWith("/login")) return "auth";
  return null;
}

/**
 * With cacheComponents, usePathname suspends on dynamic params that are not in
 * generateStaticParams (e.g. /juegos/xyz). The Suspense fallback renders the same
 * nav without an active link so the shell is still prerendered.
 */
export function Nav() {
  return (
    <Suspense fallback={<NavView active={null} />}>
      <NavWithPathname />
    </Suspense>
  );
}

function NavWithPathname() {
  const pathname = usePathname();
  return <NavView active={activeSection(pathname)} />;
}

function NavView({ active }: { active: Section | null }) {
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const cls = (s: Section) => (active === s ? "active" : "");
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={cls("inicio")}>Inicio</Link>
          <Link href="/games" className={cls("biblioteca")}>Biblioteca</Link>
          <Link href="/salon-de-la-fama" className={cls("salon")}>Salón de la Fama</Link>
          <Link href="/about" className={cls("about")}>Acerca de</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={signOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/login" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/" className={cls("inicio")} onClick={close}>Inicio</Link>
        <Link href="/games" className={cls("biblioteca")} onClick={close}>Biblioteca</Link>
        <Link href="/salon-de-la-fama" className={cls("salon")} onClick={close}>Salón de la Fama</Link>
        <Link href="/about" className={cls("about")} onClick={close}>Acerca de</Link>
        <Link href="/login" className={cls("auth")} onClick={close}>{user ? "Cuenta" : "Iniciar Sesión"}</Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
