// /api/amazon-search - Buscar productos en Amazon por palabra clave
// GET /api/amazon-search?q=auriculares
// GET /api/amazon-search?q=robot+aspirador&cat=Kitchen&max=5

export const dynamic = "force-dynamic";
export const revalidate = 0;

let searchCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 min para busquedas

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("palabra") || "";
  const category = searchParams.get("cat") || "All";
  const maxResults = Math.min(parseInt(searchParams.get("max") || "10"), 10);

  if (!query.trim()) {
    return Response.json(
      { error: "Falta el parametro 'q' (palabra de busqueda)", example: "/api/amazon-search?q=auriculares" },
      { status: 400 }
    );
  }

  const hasCredentials = !!(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY);

  if (!hasCredentials) {
    return Response.json({
      source: "unavailable",
      message: "PA-API no configurada. Configura AMAZON_ACCESS_KEY y AMAZON_SECRET_KEY para buscar en Amazon.",
      query,
      products: [],
    });
  }

  // Check cache
  const cacheKey = `${query}|${category}|${maxResults}`;
  const now = Date.now();
  if (searchCache[cacheKey] && (now - searchCache[cacheKey].ts) < CACHE_TTL) {
    return Response.json({
      source: "amazon-paapi-cached",
      query,
      category,
      count: searchCache[cacheKey].data.length,
      products: searchCache[cacheKey].data,
    });
  }

  try {
    const { searchProducts } = await import("@/lib/amazon-api");
    const products = await searchProducts(query, category, maxResults);

    // Formatear para frontend
    const formatted = products.map(p => ({
      asin: p.asin,
      titulo: p.title,
      marca: p.brand,
      imagenGrande: p.imageLarge,
      imagenMediana: p.imageMedium,
      imagen: p.image,
      galeriaImagenes: p.imageVariants,
      precio: p.priceDisplay,
      precioNumerico: p.price,
      precioAnterior: p.oldPriceDisplay,
      descuento: p.discount,
      rating: p.rating,
      reviews: p.reviews,
      prime: p.isPrime,
      disponible: p.isAvailable,
      caracteristicas: p.features,
      enlaceAfiliado: p.amazonUrl,
      ultimaActualizacion: p.lastUpdated,
    }));

    // Guardar en cache
    searchCache[cacheKey] = { data: formatted, ts: now };

    // Limpiar cache viejo (max 50 busquedas)
    const keys = Object.keys(searchCache);
    if (keys.length > 50) {
      const oldest = keys.sort((a, b) => searchCache[a].ts - searchCache[b].ts);
      oldest.slice(0, keys.length - 50).forEach(k => delete searchCache[k]);
    }

    return Response.json({
      source: "amazon-paapi",
      query,
      category,
      count: formatted.length,
      products: formatted,
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });

  } catch (err) {
    console.error("Search error:", err.message);
    return Response.json({
      source: "error",
      error: err.message,
      query,
      products: [],
    }, { status: 500 });
  }
}
