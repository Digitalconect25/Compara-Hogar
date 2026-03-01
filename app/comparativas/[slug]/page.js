import Link from "next/link";
import { notFound } from "next/navigation";
import { getComparativeBySlug, getProductsByCategory, CATEGORIES } from "@/lib/data";
import { COMPARATIVES as STATIC_COMP, CATEGORIES as STATIC_CAT } from "@/lib/products";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [...STATIC_COMP.map(c => ({ slug: c.slug })), ...STATIC_CAT.map(c => ({ slug: c.slug || c.id }))];
}

export default async function ComparativaDetailPage({ params }) {
  const { slug } = await params;
  const comp = await getComparativeBySlug(slug);
  const cat = CATEGORIES.find(c => (c.slug || c.id) === slug);

  if (comp) {
    return (
      <div className="listing-page"><div className="container">
        <div className="listing-hero"><h1>{comp.title}</h1><p>{comp.subtitle}</p></div>
        <div style={{ overflowX: "auto" }}>
          <table className="comp-table">
            <thead><tr><th>#</th><th>Producto</th><th>Nota</th><th>Precio</th><th>Destaca en</th><th></th></tr></thead>
            <tbody>
              {(comp.items || []).map(item => (
                <tr key={item.pos}><td><div className={`comp-pos comp-pos-${item.pos}`}>{item.pos}</div></td>
                  <td style={{ fontWeight: 600 }}>{item.name}{item.recommended && <span className="comp-recommended" style={{ marginLeft: 8 }}>Recomendado</span>}</td>
                  <td><span className="comp-score">{item.score}</span></td>
                  <td style={{ fontWeight: 600 }}>{item.price}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{item.best}</td>
                  <td>{item.productSlug && <Link href={`/${item.productSlug}`} style={{ color: "var(--accent-dark)", fontWeight: 600, fontSize: 13 }}>Ver &rarr;</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></div>
    );
  }

  if (cat) {
    const products = await getProductsByCategory(cat.id);
    return (
      <div className="listing-page"><div className="container">
        <div className="listing-hero"><h1>{cat.icon} {cat.name}</h1><p>{cat.description}</p></div>
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

  notFound();
}
