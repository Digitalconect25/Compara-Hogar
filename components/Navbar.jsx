"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/products";
import AdminPanel from "./AdminPanel";

export default function Navbar() {
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const catRef = useRef(null);
  const clickRef = useRef(0);
  const timerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleLogoClick = useCallback(() => {
    clickRef.current += 1;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (clickRef.current >= 5) {
      clickRef.current = 0;
      setShowAdmin(true);
      return;
    }

    // Espera 1.2s - si no llega a 5, navega al home
    timerRef.current = setTimeout(() => {
      clickRef.current = 0;
      router.push("/");
    }, 1200);
  }, [router]);

  const links = [
    { href: "/comparativas", label: "Comparativas" },
    { href: "/blog", label: "Blog" },
    { href: "/guias", label: "Guias" },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo como div, NO como enlace */}
          <div className="nav-logo" onClick={handleLogoClick} role="button" tabIndex={0} style={{ cursor: "pointer", userSelect: "none" }}>
            <div className="nav-logo-icon">C</div>
            <span className="nav-logo-text">ComparaHogar</span>
          </div>

          <div className="nav-links">
            <div ref={catRef} style={{ position: "relative" }}>
              <button className="nav-categories-btn" onClick={() => setCatOpen(!catOpen)}>
                Categorias
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={`nav-dropdown ${catOpen ? "open" : ""}`}>
                {CATEGORIES.map(cat => (
                  <Link key={cat.id} href={`/comparativas/${cat.slug || cat.id}`} className="nav-dropdown-item" onClick={() => setCatOpen(false)}>
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            {links.map(l => (
              <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </div>

          <button className="nav-mobile-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="nav-mobile-menu">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setMobileOpen(false)}>{l.label}</Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0", paddingTop: "8px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", padding: "8px 16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Categorias</p>
            {CATEGORIES.map(cat => (
              <Link key={cat.id} href={`/comparativas/${cat.slug || cat.id}`} className="nav-dropdown-item" onClick={() => setMobileOpen(false)}>
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}
