import Link from "next/link";
import { getComparatives, getProducts, CATEGORIES } from "@/lib/data";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const metadata = { title: "Comparativas - ComparaHogar", description: "Comparativas reales de productos para el hogar inteligente." };

export default async function ComparativasPage() {
  const comparatives = await getComparatives();
  const products = await getProducts();
  return (
    <div className="listing-page"><div className="container">
      <div className="listing-hero"><h1>Comparativas</h1><p>Productos probados con datos reales de rendimiento</p></div>
      <div className="blog-grid" style={{ marginBottom: 48 }}>
        {comparatives.map(comp => (
          <Link key={comp.slug} href={`/comparativas/${comp.slug}`} className="blog-card">
            <div className="blog-card-image"><img src={proxyImg(comp.image)} alt={comp.imageAlt || comp.title} loading="lazy" /></div>
            <div className="blog-card-body">
              <span className="blog-card-tag" style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}>{comp.tag}</span>
              <h2 className="blog-card-title">{comp.title}</h2>
              <p className="blog-card-excerpt">{comp.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="section-header"><h2 className="section-title">Por categoria</h2></div>
      <div className="category-grid" style={{ marginBottom: 40 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.id} href={`/comparativas/${cat.slug || cat.id}`} className="category-card">
            <div className="category-icon" style={{ background: cat.color + "15" }}>{cat.icon}</div>
            <span className="category-name">{cat.name}</span>
          </Link>
        ))}
      </div>
      <div className="section-header"><h2 className="section-title">Todos los productos</h2></div>
      <div className="product-grid">
        {products.map(p => (
          <Link key={p.slug} href={`/${p.slug}`} className="product-card">
            <div className="product-card-image"><img src={proxyImg(p.image)} alt={p.name} loading="lazy" /><div className="product-card-cta">Ver analisis</div></div>
            <div className="product-card-info"><h3 className="product-card-name">{p.name}</h3>
              <div className="product-card-prices"><span className="product-card-price">{p.price}&euro;</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div></div>
  );
}
