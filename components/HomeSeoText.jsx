"use client";
import { useState, useEffect } from "react";

var DEFAULT_SEO = {
  title: "Tu hogar inteligente empieza aqui",
  content: "En ComparaHogar.es analizamos los productos de domotica que realmente merece la pena comprar en 2026. Robots aspiradores con navegacion laser, camaras de seguridad WiFi sin cuotas mensuales, altavoces inteligentes con Alexa y Google, iluminacion que se adapta a tu rutina, enchufes con medicion de consumo y termostatos que aprenden tus horarios.\n\nCada producto pasa semanas de pruebas en hogares reales de Alicante antes de publicar su analisis. No aceptamos patrocinios de marcas: los ingresos vienen exclusivamente de comisiones de afiliado de Amazon.es, sin que eso afecte a las puntuaciones.\n\nNuestras comparativas incluyen datos de rendimiento, consumo energetico, facilidad de instalacion y compatibilidad con ecosistemas como Alexa, Google Home y Apple HomeKit. Tanto si buscas tu primer robot aspirador como si quieres montar un sistema completo de domotica, aqui tienes informacion fiable para decidir con criterio."
};

export default function HomeSeoText() {
  var [seo, setSeo] = useState(DEFAULT_SEO);

  useEffect(function() {
    fetch("/api/db/admin?type=config&configKey=home_seo&key=Compra2026")
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (json.data && json.data.title) setSeo(json.data);
      })
      .catch(function() {});
  }, []);

  return (
    <section className="section section-bg">
      <div className="container">
        <div className="seo-block">
          <h2 className="seo-block-title">{seo.title}</h2>
          <div className="seo-block-content">
            {seo.content.split("\n").filter(Boolean).map(function(p, i) {
              return <p key={i}>{p}</p>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
