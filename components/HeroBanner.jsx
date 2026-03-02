"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { proxyImg } from "@/lib/utils";

var DEFAULT_SLIDES = [
  { label: "N.1 en Espana", title: "Roborock S8 MaxV Ultra", desc: "El robot aspirador con IA mas avanzado. Fregado sonico, reconocimiento de objetos y autovaciado con agua caliente.", cta: "Ver analisis completo", href: "/roborock-s8-maxv-ultra", gradient: "linear-gradient(135deg, #065F46 0%, #0D9488 50%, #14B8A6 100%)", accentColor: "#6EE7B7", image: PRODUCTS[0] ? PRODUCTS[0].image : "" },
  { label: "Mejor calidad-precio", title: "Amazon Echo Show 8", desc: "Pantalla inteligente con Alexa, hub Zigbee integrado y camara de 13MP. El centro de control de tu hogar.", cta: "Leer review", href: "/echo-show-8-2024", gradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #6366F1 100%)", accentColor: "#A5B4FC", image: PRODUCTS[3] ? PRODUCTS[3].image : "" },
  { label: "Sin suscripcion", title: "Tapo C320WS", desc: "Camara de seguridad exterior 2K con vision nocturna a color. Graba en tarjeta SD, cero cuotas mensuales.", cta: "Ver comparativa", href: "/tapo-c320ws", gradient: "linear-gradient(135deg, #1C1917 0%, #44403C 50%, #78716C 100%)", accentColor: "#FCD34D", image: PRODUCTS[6] ? PRODUCTS[6].image : "" },
];

export default function HeroBanner() {
  var [current, setCurrent] = useState(0);
  var [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(function() {
    fetch("/api/db/admin?type=config&configKey=hero_slides&key=Compra2026")
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          var merged = json.data.map(function(s, i) {
            var def = DEFAULT_SLIDES[i] || {};
            return {
              label: s.label || def.label || "",
              title: s.title || def.title || "",
              desc: s.desc || def.desc || "",
              cta: s.cta || def.cta || "Ver mas",
              href: s.href || def.href || "/",
              gradient: s.gradient || def.gradient || "linear-gradient(135deg, #1E1B4B, #6366F1)",
              accentColor: s.accentColor || def.accentColor || "#A5B4FC",
              image: s.image || def.image || "",
            };
          });
          setSlides(merged);
        }
      })
      .catch(function() {});
  }, []);

  useEffect(function() {
    var timer = setInterval(function() { setCurrent(function(c) { return (c + 1) % slides.length; }); }, 6000);
    return function() { clearInterval(timer); };
  }, [slides.length]);

  var slide = slides[current];
  function prev() { setCurrent(function(c) { return (c - 1 + slides.length) % slides.length; }); }
  function next() { setCurrent(function(c) { return (c + 1) % slides.length; }); }

  return (
    <div className="hero-banner">
      <div className="hero-slides">
        <div className="hero-slide" key={current} style={{ background: slide.gradient }}>
          <div className="hero-deco-circle hero-deco-1" style={{ background: slide.accentColor }} />
          <div className="hero-deco-circle hero-deco-2" style={{ background: slide.accentColor }} />
          <div className="hero-deco-grid" />
          <div className="hero-slide-content">
            <div className="hero-text">
              <span className="hero-label" style={{ background: "rgba(255,255,255,0.12)", color: slide.accentColor, backdropFilter: "blur(8px)" }}>{slide.label}</span>
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-desc">{slide.desc}</p>
              <Link href={slide.href} className="hero-cta" style={{ background: slide.accentColor, color: "#111" }}>
                {slide.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
            <div className="hero-image-wrap">
              <div className="hero-image-glow" style={{ background: slide.accentColor }} />
              {slide.image && <img src={proxyImg(slide.image)} alt={slide.title} className="hero-product-img" loading="eager" />}
            </div>
          </div>
        </div>
      </div>
      <button className="hero-nav-btn hero-nav-prev" onClick={prev} aria-label="Anterior">&lsaquo;</button>
      <button className="hero-nav-btn hero-nav-next" onClick={next} aria-label="Siguiente">&rsaquo;</button>
      <div className="hero-dots">
        {slides.map(function(_, i) {
          return <button key={i} className={"hero-dot " + (i === current ? "active" : "")} onClick={function() { setCurrent(i); }} aria-label={"Slide " + (i + 1)} />;
        })}
      </div>
    </div>
  );
}
