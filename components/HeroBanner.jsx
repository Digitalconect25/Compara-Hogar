"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { proxyImg } from "@/lib/utils";

const SLIDES = [
  {
    label: "N.1 en Espana",
    labelStyle: { background: "var(--accent-soft)", color: "var(--accent-dark)" },
    title: "Roborock S8 MaxV Ultra",
    desc: "El robot aspirador con IA mas avanzado. Fregado sonico, reconocimiento de objetos y autovaciado con agua caliente.",
    cta: "Ver analisis completo",
    href: "/roborock-s8-maxv-ultra",
    bgColor: "#F0FDF4",
    image: PRODUCTS[0]?.image,
  },
  {
    label: "Mejor relacion calidad-precio",
    labelStyle: { background: "var(--orange-soft)", color: "var(--orange)" },
    title: "Amazon Echo Show 8",
    desc: "Pantalla inteligente con Alexa, hub Zigbee integrado y camara de 13MP. El centro de control de tu hogar.",
    cta: "Leer review",
    href: "/echo-show-8-2024",
    bgColor: "#F5F3FF",
    image: PRODUCTS[3]?.image,
  },
  {
    label: "Sin suscripcion",
    labelStyle: { background: "var(--purple-soft)", color: "var(--purple)" },
    title: "Tapo C320WS",
    desc: "Camara de seguridad exterior 2K con vision nocturna a color. Graba en tarjeta SD, cero cuotas mensuales.",
    cta: "Ver comparativa",
    href: "/tapo-c320ws",
    bgColor: "#EFF6FF",
    image: PRODUCTS[6]?.image,
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];
  const prev = () => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent(c => (c + 1) % SLIDES.length);

  return (
    <div className="hero-banner">
      <div className="hero-slides">
        <div className="hero-slide" key={current} style={{ background: slide.bgColor }}>
          <div className="hero-slide-content">
            <div className="hero-text">
              <span className="hero-label" style={slide.labelStyle}>{slide.label}</span>
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-desc">{slide.desc}</p>
              <Link href={slide.href} className="hero-cta">
                {slide.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
            <div className="hero-image-wrap">
              {slide.image && <img src={proxyImg(slide.image)} alt={slide.title} className="hero-product-img" loading="eager" />}
            </div>
          </div>
        </div>
      </div>
      <button className="hero-nav-btn hero-nav-prev" onClick={prev} aria-label="Anterior">&lsaquo;</button>
      <button className="hero-nav-btn hero-nav-next" onClick={next} aria-label="Siguiente">&rsaquo;</button>
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? "active" : ""}`} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
