// /api/amazon-sync - Sincroniza precios e imagenes via Amazon PA-API 5.0
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PRODUCTS } from "@/lib/products";

function extractASIN(url) {
  if (!url) return null;
  if (/^[A-Z0-9]{10}$/.test(url)) return url;
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}

let priceCache = {};
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const singleAsin = searchParams.get("asin");
  const isTest = searchParams.get("test") === "1";

  const accessKey = process.env.AMAZON_ACCESS_KEY || "";
  const secretKey = process.env.AMAZON_SECRET_KEY || "";
  const partnerTag = process.env.AMAZON_PARTNER_TAG || "digitalconect-21";
  const hasCredentials = !!(accessKey && secretKey);

  const diag = {
    hasAccessKey: !!accessKey,
    accessKeyPrefix: accessKey ? accessKey.slice(0, 6) + "..." : "NOT SET",
    hasSecretKey: !!secretKey,
    secretKeyLength: secretKey.length,
    partnerTag,
    envKeys: Object.keys(process.env).filter(k => k.includes("AMAZON")).sort(),
  };

  // TEST MODE
  if (isTest) {
    if (!hasCredentials) {
      return Response.json({ status: "error", message: "Credenciales PA-API no encontradas", diagnostic: diag });
    }

    // Test con llamada directa (sin depender de getItemsByASIN que traga errores)
    try {
      const crypto = await import("crypto");

      function hmac(key, data) { return crypto.createHmac("sha256", key).update(data, "utf8").digest(); }
      function hashStr(data) { return crypto.createHash("sha256").update(data, "utf8").digest("hex"); }

      const host = "webservices.amazon.es";
      const region = "eu-west-1";
      const service = "ProductAdvertisingAPI";
      const testAsins = ["B0CRV7F37B", "B09B8X9RGM", "B0BLS3Y632"];

      const now = new Date();
      const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "");
      const dateStamp = amzDate.slice(0, 8);

      const payload = JSON.stringify({
        ItemIds: testAsins,
        ItemIdType: "ASIN",
        Resources: [
          "ItemInfo.Title",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "Images.Primary.Large",
          "CustomerReviews.StarRating",
          "CustomerReviews.Count",
        ],
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.es",
      });

      const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
      const apiPath = "/paapi5/getitems";

      const headers = {
        "content-encoding": "amz-1.0",
        "content-type": "application/json; charset=utf-8",
        "host": host,
        "x-amz-date": amzDate,
        "x-amz-target": target,
      };

      const signedHeaders = Object.keys(headers).sort().join(";");
      const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join("");
      const canonicalRequest = ["POST", apiPath, "", canonicalHeaders, signedHeaders, hashStr(payload)].join("\n");
      const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
      const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashStr(canonicalRequest)].join("\n");

      const kDate = hmac("AWS4" + secretKey, dateStamp);
      const kRegion = hmac(kDate, region);
      const kService = hmac(kRegion, service);
      const signingKey = hmac(kService, "aws4_request");
      const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

      const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      const res = await fetch(`https://${host}${apiPath}`, {
        method: "POST",
        headers: { ...headers, Authorization: auth },
        body: payload,
      });

      const responseText = await res.text();

      if (!res.ok) {
        // Parse Amazon error
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = JSON.parse(responseText);
          errMsg = errJson.Errors?.[0]?.Message || errJson.__type || responseText.slice(0, 300);
        } catch { errMsg = responseText.slice(0, 300); }

        const helpMap = {
          "UnrecognizedClient": "La Access Key no es valida. Revisa que la copiaste bien desde Amazon Associates.",
          "InvalidSignature": "La Secret Key no es correcta. Regenera las credenciales en Amazon Associates.",
          "TooManyRequests": "Limite de peticiones alcanzado. Espera 1 minuto e intenta de nuevo.",
          "AccessDenied": "Acceso denegado. Tu cuenta puede no tener PA-API activa (necesitas 3 ventas en 30 dias).",
          "InvalidPartnerTag": "El tag de afiliado no es valido o no esta asociado a estas credenciales.",
        };
        const errType = Object.keys(helpMap).find(k => responseText.includes(k));

        return Response.json({
          status: "error",
          message: errMsg,
          httpStatus: res.status,
          help: errType ? helpMap[errType] : "Revisa credenciales en Amazon Associates > Herramientas > PA-API",
          diagnostic: diag,
        });
      }

      // Parse success
      const data = JSON.parse(responseText);
      const items = data.ItemsResult?.Items || [];
      const errors = data.Errors || [];

      if (items.length > 0) {
        const first = items[0];
        const price = first.Offers?.Listings?.[0]?.Price;
        return Response.json({
          status: "ok",
          message: `PA-API funciona! ${items.length} productos obtenidos`,
          diagnostic: diag,
          testProducts: items.map(it => ({
            asin: it.ASIN,
            title: it.ItemInfo?.Title?.DisplayValue || "sin titulo",
            price: price?.DisplayAmount || it.Offers?.Listings?.[0]?.Price?.DisplayAmount || "sin precio",
            image: it.Images?.Primary?.Large?.URL ? "OK" : "sin imagen",
            rating: it.CustomerReviews?.StarRating?.Value || "N/A",
            reviews: it.CustomerReviews?.Count || 0,
          })),
          errors: errors.map(e => ({ code: e.Code, msg: e.Message, asin: e.ItemId })),
        });
      }

      // No items but maybe errors
      return Response.json({
        status: "warning",
        message: errors.length > 0
          ? "PA-API responde pero con errores: " + errors.map(e => `${e.Code}: ${e.Message}`).join("; ")
          : "PA-API responde pero no devolvio productos. Respuesta: " + responseText.slice(0, 200),
        diagnostic: diag,
        errors: errors.map(e => ({ code: e.Code, msg: e.Message })),
        rawSnippet: responseText.slice(0, 300),
      });

    } catch (err) {
      return Response.json({
        status: "error",
        message: "Error tecnico: " + err.message,
        diagnostic: diag,
        stack: err.stack?.split("\n").slice(0, 3),
      });
    }
  }

  // Normal mode - sin credenciales
  if (!hasCredentials) {
    const products = PRODUCTS.map(p => ({
      productId: p.id, slug: p.slug, asin: extractASIN(p.amazonUrl), name: p.name,
      amazon: null,
      catalog: { price: p.price, oldPrice: p.oldPrice || "", rating: p.rating, reviews: p.reviews, image: p.image },
    }));
    const filtered = singleAsin ? products.filter(p => p.asin === singleAsin.toUpperCase()) : products;
    return Response.json({ source: "catalog", message: "PA-API no configurada", count: filtered.length, products: filtered });
  }

  // Normal mode - con credenciales
  try {
    const { getItemsByASIN } = await import("@/lib/amazon-api");

    let asins = singleAsin
      ? [singleAsin.toUpperCase()]
      : [...new Set(PRODUCTS.map(p => extractASIN(p.amazonUrl)).filter(Boolean))];

    const now = Date.now();
    const cached = [], toFetch = [];
    for (const asin of asins) {
      if (priceCache[asin] && (now - priceCache[asin].ts) < CACHE_TTL) cached.push(priceCache[asin].data);
      else toFetch.push(asin);
    }

    let fresh = [];
    if (toFetch.length > 0) {
      fresh = await getItemsByASIN(toFetch);
      fresh.forEach(item => { priceCache[item.asin] = { data: item, ts: now }; });
    }

    const allAmazon = [...cached, ...fresh];

    const products = asins.map(asin => {
      const cat = PRODUCTS.find(p => extractASIN(p.amazonUrl) === asin);
      const amz = allAmazon.find(a => a.asin === asin);
      return {
        productId: cat?.id || null, slug: cat?.slug || null,
        name: cat?.name || amz?.title || asin, asin,
        amazon: amz ? {
          title: amz.title, price: amz.priceFormatted, priceAmount: amz.price,
          oldPrice: amz.oldPriceFormatted, discount: amz.discount,
          rating: amz.rating, reviews: amz.reviews,
          image: amz.image, imageLarge: amz.imageLarge, imageMedium: amz.imageMedium,
          imageVariants: amz.imageVariants, brand: amz.brand,
          features: amz.features, isPrime: amz.isPrime, isAvailable: amz.isAvailable,
          lastUpdated: amz.lastUpdated,
        } : null,
        catalog: cat ? { price: cat.price, oldPrice: cat.oldPrice, rating: cat.rating, reviews: cat.reviews, image: cat.image } : null,
      };
    });

    return Response.json({
      source: "amazon-paapi", count: products.length, cached: cached.length, fetched: fresh.length, products,
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });

  } catch (err) {
    return Response.json({
      source: "error", error: err.message,
      products: PRODUCTS.map(p => ({
        productId: p.id, slug: p.slug, asin: extractASIN(p.amazonUrl), name: p.name, amazon: null,
        catalog: { price: p.price, oldPrice: p.oldPrice, rating: p.rating, reviews: p.reviews, image: p.image },
      })),
    });
  }
}
