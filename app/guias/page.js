import Link from "next/link";
import { getGuias } from "@/lib/data";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const metadata = { title: "Guias de compra - ComparaHogar", description: "Guias paso a paso para tu hogar inteligente." };

export default async function GuiasPage() {
  const guias = await getGuias();
  return (
    <div className="listing-page"><div className="container">
      <div className="listing-hero"><h1>Guias de compra</h1><p>Paso a paso para elegir la mejor tecnologia para tu hogar</p></div>
      <div className="blog-grid">
        {guias.map(g => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="blog-card">
            <div className="blog-card-image"><img src={proxyImg(g.image)} alt={g.imageAlt || g.title} loading="lazy" /></div>
            <div className="blog-card-body">
              <span className="blog-card-tag" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}>Guia</span>
              <h2 className="blog-card-title">{g.title}</h2>
              <p className="blog-card-excerpt">{g.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div></div>
  );
}
