export const runtime = "edge";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || !url.includes("amazon.com/images") && !url.includes("media-amazon.com")) {
    return new Response("Invalid URL", { status: 400 });
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ComparaHogar/1.0)" },
    });
    if (!res.ok) return new Response("Image not found", { status: 404 });
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Fetch error", { status: 500 });
  }
}
