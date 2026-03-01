// ============================================================
// AMAZON PA-API 5.0 - ComparaHogar
// Firma manual AWS Signature V4 (compatible con Next.js/Vercel)
// ============================================================
// Credenciales en .env.local:
//   AMAZON_ACCESS_KEY  - Clave de acceso PA-API
//   AMAZON_SECRET_KEY  - Clave secreta PA-API
//   AMAZON_PARTNER_TAG - Tag de afiliado (digitalconect-21)
// ============================================================

const crypto = require("crypto");

const getConfig = () => ({
  accessKey: process.env.AMAZON_ACCESS_KEY || "",
  secretKey: process.env.AMAZON_SECRET_KEY || "",
  partnerTag: process.env.AMAZON_PARTNER_TAG || "digitalconect-21",
  host: "webservices.amazon.es",
  region: "eu-west-1",
  service: "ProductAdvertisingAPI",
  marketplace: "www.amazon.es",
});

// ============================================================
// AWS SIGNATURE V4
// ============================================================

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function hash(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function getSignatureKey(key, dateStamp, region, service) {
  const kDate = hmac("AWS4" + key, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function signRequest(payload, path, target) {
  const config = getConfig();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const headers = {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    "host": config.host,
    "x-amz-date": amzDate,
    "x-amz-target": `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${target}`,
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join("");
  const payloadStr = JSON.stringify(payload);
  const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, hash(payloadStr)].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/${config.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hash(canonicalRequest)].join("\n");
  const signingKey = getSignatureKey(config.secretKey, dateStamp, config.region, config.service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return {
    url: `https://${config.host}${path}`,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: payloadStr,
  };
}

// ============================================================
// LLAMADA A PA-API
// ============================================================

async function callAmazonAPI(payload, target) {
  const config = getConfig();
  if (!config.accessKey || !config.secretKey) {
    throw new Error("PA-API credentials not configured");
  }

  const path = `/paapi5/${target.toLowerCase().replace("items", "items")}`;
  const pathMap = {
    GetItems: "/paapi5/getitems",
    SearchItems: "/paapi5/searchitems",
  };

  const req = signRequest(payload, pathMap[target] || path, target);

  const response = await fetch(req.url, {
    method: "POST",
    headers: req.headers,
    body: req.body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PA-API ${response.status}: ${errText.slice(0, 200)}`);
  }

  return response.json();
}

// Recursos completos para fichas de producto
const FULL_RESOURCES = [
  "Images.Primary.Large",
  "Images.Primary.Medium",
  "Images.Variants.Large",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "ItemInfo.ByLineInfo",
  "ItemInfo.ProductInfo",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Listings.Condition",
  "Offers.Listings.DeliveryInfo.IsPrimeEligible",
  "Offers.Listings.MerchantInfo",
  "Offers.Summaries.LowestPrice",
  "CustomerReviews.StarRating",
  "CustomerReviews.Count",
];

// Recursos para busqueda
const SEARCH_RESOURCES = [
  "Images.Primary.Large",
  "Images.Primary.Medium",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "ItemInfo.ByLineInfo",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Listings.DeliveryInfo.IsPrimeEligible",
  "CustomerReviews.StarRating",
  "CustomerReviews.Count",
];

// ============================================================
// OBTENER PRODUCTOS POR ASIN
// ============================================================

export async function getItemsByASIN(asins) {
  if (!asins || asins.length === 0) return [];

  const config = getConfig();
  const allItems = [];

  // PA-API acepta max 10 ASINs por llamada
  const chunks = [];
  for (let i = 0; i < asins.length; i += 10) {
    chunks.push(asins.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    try {
      const payload = {
        ItemIds: chunk,
        ItemIdType: "ASIN",
        Resources: FULL_RESOURCES,
        PartnerTag: config.partnerTag,
        PartnerType: "Associates",
        Marketplace: config.marketplace,
      };

      const data = await callAmazonAPI(payload, "GetItems");

      if (data.ItemsResult?.Items) {
        allItems.push(...data.ItemsResult.Items.map(parseAmazonItem));
      }

      if (data.Errors) {
        data.Errors.forEach(err => {
          console.warn(`PA-API: ${err.Code} - ${err.Message}`);
        });
      }

      // Rate limit: 1 req/segundo
      if (chunks.length > 1) {
        await new Promise(r => setTimeout(r, 1100));
      }
    } catch (err) {
      console.error("Error PA-API GetItems:", chunk, err.message);
    }
  }

  return allItems;
}

// ============================================================
// BUSCAR PRODUCTOS POR PALABRA CLAVE
// ============================================================

export async function searchProducts(keywords, category = "All", maxResults = 10) {
  const config = getConfig();
  const payload = {
    Keywords: keywords,
    SearchIndex: category,
    ItemCount: Math.min(maxResults, 10),
    Resources: SEARCH_RESOURCES,
    PartnerTag: config.partnerTag,
    PartnerType: "Associates",
    Marketplace: config.marketplace,
  };

  const data = await callAmazonAPI(payload, "SearchItems");
  if (!data.SearchResult?.Items) return [];
  return data.SearchResult.Items.map(parseAmazonItem);
}

// ============================================================
// PARSER - Respuesta PA-API a formato ComparaHogar
// ============================================================

function parseAmazonItem(item) {
  const listing = item.Offers?.Listings?.[0];
  const price = listing?.Price;
  const savingBasis = listing?.SavingBasis;

  const priceAmount = price?.Amount || 0;
  const priceDisplay = price?.DisplayAmount || "";
  const oldPriceAmount = savingBasis?.Amount || 0;
  const oldPriceDisplay = savingBasis?.DisplayAmount || "";

  const discount = oldPriceAmount > 0
    ? Math.round(((oldPriceAmount - priceAmount) / oldPriceAmount) * 100)
    : 0;

  const rating = item.CustomerReviews?.StarRating?.Value || 0;
  const reviews = item.CustomerReviews?.Count || 0;
  const features = item.ItemInfo?.Features?.DisplayValues || [];

  // Imagenes con fallback
  const imageLarge = item.Images?.Primary?.Large?.URL || "";
  const imageMedium = item.Images?.Primary?.Medium?.URL || "";
  const image = imageLarge || imageMedium || "";

  // Galeria de variantes
  const variants = item.Images?.Variants?.map(v => ({
    large: v.Large?.URL || "",
    medium: v.Medium?.URL || "",
  })) || [];

  const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "";
  const isPrime = listing?.DeliveryInfo?.IsPrimeEligible || false;
  const isAvailable = listing?.Condition?.Value === "New" || !!price;

  const config = getConfig();
  return {
    asin: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue || "",
    image,
    imageLarge,
    imageMedium,
    imageVariants: variants,
    price: priceAmount,
    priceFormatted: formatPrice(priceAmount),
    priceDisplay,
    oldPrice: oldPriceAmount,
    oldPriceFormatted: oldPriceAmount > 0 ? formatPrice(oldPriceAmount) : "",
    oldPriceDisplay,
    discount,
    rating: parseFloat(rating) || 0,
    reviews: parseInt(reviews) || 0,
    features: features.slice(0, 5),
    brand,
    isPrime,
    isAvailable,
    amazonUrl: `https://www.amazon.es/dp/${item.ASIN}?tag=${config.partnerTag}`,
    detailPageURL: item.DetailPageURL || "",
    lastUpdated: new Date().toISOString(),
  };
}

function formatPrice(amount) {
  if (!amount || amount === 0) return "";
  return amount.toFixed(2).replace(".", ",");
}

// ============================================================
// EXTRAER ASIN
// ============================================================

export function extractASIN(urlOrAsin) {
  if (!urlOrAsin) return null;
  if (/^[A-Z0-9]{10}$/.test(urlOrAsin)) return urlOrAsin;
  const match = urlOrAsin.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

// ============================================================
// SINCRONIZAR CATALOGO COMPLETO
// ============================================================

export async function syncProductPrices(products) {
  const asinMap = {};
  products.forEach(p => {
    const asin = extractASIN(p.amazonUrl);
    if (asin) asinMap[asin] = p;
  });

  const asins = Object.keys(asinMap);
  if (asins.length === 0) return { updated: [], errors: [] };

  try {
    const amazonData = await getItemsByASIN(asins);

    const updated = amazonData.map(item => {
      const original = asinMap[item.asin];
      return {
        productId: original?.id,
        slug: original?.slug,
        asin: item.asin,
        amazonTitle: item.title,
        price: item.priceFormatted,
        oldPrice: item.oldPriceFormatted,
        discount: item.discount,
        rating: item.rating,
        reviews: item.reviews,
        image: item.image,
        imageLarge: item.imageLarge,
        imageMedium: item.imageMedium,
        imageVariants: item.imageVariants,
        isPrime: item.isPrime,
        isAvailable: item.isAvailable,
        features: item.features,
        brand: item.brand,
        lastUpdated: item.lastUpdated,
      };
    });

    return { updated, errors: [] };
  } catch (err) {
    return { updated: [], errors: [err.message] };
  }
}
