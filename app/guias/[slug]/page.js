import { notFound } from "next/navigation";
import { getGuiaBySlug } from "@/lib/data";
import { GUIAS as STATIC } from "@/lib/products";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() { return STATIC.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const g = await getGuiaBySlug(slug); if (!g) return { title: "No encontrado" }; return { title: g.metaTitle || g.title, description: g.metaDescription || g.excerpt }; }

export default async function GuiaDetailPage({ params }) {
  const { slug } = await params;
  const guia = await getGuiaBySlug(slug);
  if (!guia) notFound();
  return (
    <div className="article-page"><div className="container">
      <div className="article-header">
        <span className="blog-card-tag" style={{ background: "var(--orange-soft)", color: "var(--orange)", marginBottom: 12, display: "inline-block" }}>Guia</span>
        <h1>{guia.title}</h1>
        <div className="article-meta"><span>{guia.readTime}</span></div>
      </div>
      {guia.image && <img src={proxyImg(guia.image)} alt={guia.imageAlt || guia.title} className="article-featured-img" />}
      <div className="article-body">
        {(guia.content || "").split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div></div>
  );
}
