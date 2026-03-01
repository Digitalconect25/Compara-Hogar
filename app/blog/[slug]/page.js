import { notFound } from "next/navigation";
import { getBlogBySlug, getBlogPosts } from "@/lib/data";
import { BLOG_POSTS as STATIC } from "@/lib/products";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() { return STATIC.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const p = await getBlogBySlug(slug); if (!p) return { title: "No encontrado" }; return { title: p.metaTitle || p.title, description: p.metaDescription || p.excerpt }; }

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();
  return (
    <div className="article-page"><div className="container">
      <div className="article-header">
        <span className="blog-card-tag" style={{ background: (post.tagColor || "var(--accent)") + "18", color: post.tagColor || "var(--accent)", marginBottom: 12, display: "inline-block" }}>{post.tag}</span>
        <h1>{post.title}</h1>
        <div className="article-meta"><span>{post.date}</span><span>{post.readTime}</span></div>
      </div>
      {post.image && <img src={proxyImg(post.image)} alt={post.imageAlt || post.title} className="article-featured-img" />}
      <div className="article-body">
        {(post.content || "").split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        {post.ctas?.length > 0 && <div className="article-ctas">{post.ctas.map((cta, i) => <a key={i} href={cta.url} target="_blank" rel="nofollow noopener noreferrer sponsored" className="article-cta-btn">{cta.text}</a>)}</div>}
      </div>
    </div></div>
  );
}
