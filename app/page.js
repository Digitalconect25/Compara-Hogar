import Link from "next/link";
import { getProducts, CATEGORIES } from "@/lib/data";
import { proxyImg } from "@/lib/utils";
import HeroBanner from "@/components/HeroBanner";
import HomeSeoText from "@/components/HomeSeoText";
import HomeOffers from "@/components/HomeOffers";

export const revalidate = 60;

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return <span className="product-card-stars">{"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}</span>;
}

function discount(price, oldPrice) {
  if (!oldPrice) return null;
  const p = parseFloat(String(price).replace(/[^\d,]/g, "").replace(",", "."));
  const o = parseFloat(String(oldPrice).replace(/[^\d,]/g, "").replace(",", "."));
  if (!p || !o || o <= p) return null;
  return Math.round(((o - p) / o) * 100);
}

function ProductCard({ p }) {
  const disc = discount(p.price, p.oldPrice);
  return (
    <Link href={"/" + p.slug} className="product-card">
      <div className="product-card-image">
        {p.badge && <span className="product-card-badge" style={{ background: p.badgeColor || "var(--accent)" }}>{p.badge}</span>}
        <img src={proxyImg(p.image)} alt={p.imageAlt || p.name} loading="lazy" />
        <div className="product-card-cta">Ver analisis completo</div>
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{p.name}</h3>
        <div className="product-card-rating"><StarRating rating={p.rating} /><span className="product-card-reviews">({p.reviews})</span></div>
        <div className="product-card-prices">
          <span className="product-card-price">{p.price}&euro;</span>
          {p.oldPrice && <span className="product-card-oldprice">{p.oldPrice}&euro;</span>}
          {disc && <span className="product-card-discount">-{disc}%</span>}
        </div>
      </div>
    </Link>
  );
}

function CompactCard({ p, rank }) {
  return (
    <Link href={"/" + p.slug} className="compact-card">
      <span className="compact-rank">{rank}</span>
      <div className="compact-img"><img src={proxyImg(p.image)} alt={p.name} loading="lazy" /></div>
      <div className="compact-info">
        <h4 className="compact-name">{p.name}</h4>
        <div className="compact-meta">
          <span className="compact-stars">{"★".repeat(Math.floor(p.rating))}</span>
          <span className="compact-reviews">({p.reviews})</span>
        </div>
        <span className="compact-price">{p.price}&euro;</span>
      </div>
      <svg className="compact-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </Link>
  );
}

export default async function HomePage() {
  const PRODUCTS = await getProducts();
  const featured = PRODUCTS.filter(p => p.weeklyBest);

  const byCategory = {};
  PRODUCTS.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  const activeCats = CATEGORIES.filter(c => byCategory[c.id] && byCategory[c.id].length >= 1);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Productos destacados de hogar inteligente 2026",
    numberOfItems: featured.length,
    itemListElement: featured.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: "https://comparahogar.es/" + p.slug,
      name: p.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <HeroBanner />

      {/* Barra de confianza */}
      <div className="trust-strip"><div className="trust-strip-inner">
        <div className="trust-item"><div className="trust-icon trust-icon-green">&#x1F50D;</div><div className="trust-text"><h4>Analisis reales</h4><p>Probamos cada producto durante semanas</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-orange">&#x1F6AB;</div><div className="trust-text"><h4>Sin patrocinios</h4><p>Opiniones 100% independientes</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-purple">&#x1F4B0;</div><div className="trust-text"><h4>Precios actualizados</h4><p>Sincronizados con Amazon.es</p></div></div>
        <div className="trust-item"><div className="trust-icon trust-icon-blue">&#x1F4DA;</div><div className="trust-text"><h4>Guias gratuitas</h4><p>Todo el contenido libre y accesible</p></div></div>
      </div></div>

      {/* Ofertas Amazon - botones configurables */}
      <HomeOffers />

      {/* Categorias con imagenes */}
      <section className="section"><div className="container">
        <div className="section-header"><h2 className="section-title">Explora por categoria</h2></div>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link key={cat.id} href={"/comparativas/" + (cat.slug || cat.id)} className="category-card-img">
              <div className="category-card-visual">
                <img src={proxyImg(cat.categoryImage)} alt={cat.name} className="category-card-photo" loading="lazy" />
                <div className="category-card-overlay" style={{ background: "linear-gradient(180deg, transparent 30%, " + cat.color + "DD 100%)" }} />
                <span className="category-card-count">{(byCategory[cat.id] || []).length} productos</span>
              </div>
              <div className="category-card-label">
                <span className="category-card-icon-mini">{cat.icon}</span>
                <span className="category-card-title">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div></section>

      {/* Productos destacados */}
      <section className="section section-bg"><div className="container">
        <div className="section-header">
          <h2 className="section-title">Productos destacados de la semana</h2>
          <Link href="/comparativas" className="section-viewall">Ver todos &rarr;</Link>
        </div>
        <div className="product-grid">{featured.map(p => <ProductCard key={p.id || p.slug} p={p} />)}</div>
      </div></section>

      {/* Promos */}
      <section className="section"><div className="container">
        <div className="promo-grid">
          <Link href="/comparativas/mejores-robots-aspiradores" className="promo-card" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
            <span className="promo-label" style={{ color: "var(--accent-dark)" }}>Comparativa 2026</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Top 5 Robots Aspiradores</h3>
            <p className="promo-subtitle" style={{ color: "var(--text-secondary)" }}>3 meses de pruebas reales</p>
            <span className="promo-btn" style={{ background: "var(--accent)", color: "#fff" }}>Ver comparativa &rarr;</span>
            {PRODUCTS[0]?.image && <img src={proxyImg(PRODUCTS[0].image)} alt="Robots aspiradores 2026" className="promo-img" style={{ maxHeight: "160px" }} />}
          </Link>
          <Link href="/comparativas/camaras-seguridad-baratas" className="promo-card" style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
            <span className="promo-label" style={{ color: "var(--purple)" }}>Menos de 70 euros</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Camaras de seguridad</h3>
            <p className="promo-subtitle" style={{ color: "var(--text-secondary)" }}>Sin suscripcion mensual</p>
            <span className="promo-btn" style={{ background: "var(--purple)", color: "#fff" }}>Ver comparativa &rarr;</span>
            {PRODUCTS[6]?.image && <img src={proxyImg(PRODUCTS[6].image)} alt="Camaras seguridad baratas" className="promo-img" style={{ maxHeight: "140px" }} />}
          </Link>
          <Link href="/guias/domotica-principiantes" className="promo-card promo-card-full" style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}>
            <span className="promo-label" style={{ color: "var(--orange)" }}>Guia gratuita</span>
            <h3 className="promo-title" style={{ color: "var(--text-primary)" }}>Hogar inteligente por menos de 200 euros</h3>
            <span className="promo-btn" style={{ background: "var(--orange)", color: "#fff" }}>Leer guia &rarr;</span>
          </Link>
        </div>
      </div></section>

      {/* SECCIONES POR CATEGORIA */}
      {activeCats.map((cat, idx) => {
        const catProducts = byCategory[cat.id] || [];
        const isAlt = idx % 2 === 0;
        return (
          <section key={cat.id} className={"section" + (isAlt ? " section-bg" : "")} id={cat.slug || cat.id}>
            <div className="container">
              <div className="section-header">
                <div className="section-header-left">
                  <span className="section-icon" style={{ background: cat.color + "18", color: cat.color }}>{cat.icon}</span>
                  <div>
                    <h2 className="section-title">{cat.name}</h2>
                    <p className="section-subtitle">{cat.description}</p>
                  </div>
                </div>
                <Link href={"/comparativas/" + (cat.slug || cat.id)} className="section-viewall">Ver comparativa completa &rarr;</Link>
              </div>
              {catProducts.length <= 3 ? (
                <div className="product-grid">
                  {catProducts.map(p => <ProductCard key={p.id || p.slug} p={p} />)}
                </div>
              ) : (
                <div className="category-section-layout">
                  <div className="category-featured">
                    <ProductCard p={catProducts[0]} />
                  </div>
                  <div className="category-list">
                    {catProducts.slice(1).map((p, i) => <CompactCard key={p.id || p.slug} p={p} rank={i + 2} />)}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Texto SEO editable desde admin */}
      <HomeSeoText />

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-header"><h2 className="section-title">Preguntas frecuentes</h2></div>
          <div className="faq-grid">
            <details className="faq-item"><summary className="faq-q">Como elegimos los productos que analizamos?</summary><p className="faq-a">Seleccionamos los productos mas vendidos y mejor valorados en Amazon.es. Cada uno se prueba durante semanas en condiciones reales en hogares de Alicante antes de publicar la review.</p></details>
            <details className="faq-item"><summary className="faq-q">Los precios se actualizan automaticamente?</summary><p className="faq-a">Si. Los precios se sincronizan con Amazon.es y se actualizan regularmente. Siempre veras el precio real con enlace directo a la oferta.</p></details>
            <details className="faq-item"><summary className="faq-q">Que significa que sois independientes?</summary><p className="faq-a">No aceptamos pagos de marcas para posicionar productos. Nuestros ingresos vienen de comisiones de afiliado de Amazon, pero eso no influye en las puntuaciones ni en las recomendaciones.</p></details>
            <details className="faq-item"><summary className="faq-q">Puedo pedir que analiceis un producto concreto?</summary><p className="faq-a">Claro. Escribenos a info.digitalconect@gmail.com con tu sugerencia y lo evaluaremos para futuras comparativas.</p></details>
          </div>
        </div>
      </section>
    </>
  );
}
