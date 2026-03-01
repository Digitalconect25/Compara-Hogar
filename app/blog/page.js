import Link from "next/link";
import { getBlogPosts } from "@/lib/data";
import { proxyImg } from "@/lib/utils";
export const revalidate = 60;
export const metadata = { title: "Blog - ComparaHogar", description: "Experiencias reales con tecnologia para el hogar." };

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <div className="listing-page"><div className="container">
      <div className="listing-hero"><h1>Blog</h1><p>Experiencias reales montando un hogar inteligente</p></div>
      <div className="blog-grid">
        {posts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
            <div className="blog-card-image"><img src={proxyImg(post.image)} alt={post.imageAlt || post.title} loading="lazy" /></div>
            <div className="blog-card-body">
              <span className="blog-card-tag" style={{ background: (post.tagColor || "var(--accent)") + "18", color: post.tagColor || "var(--accent)" }}>{post.tag}</span>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-meta"><span>{post.date}</span><span>{post.readTime}</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div></div>
  );
}
