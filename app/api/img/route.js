export const runtime = "edge";

function extractDriveId(url) {
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  var m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://drive.google.com/open?id=FILE_ID
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://docs.google.com/uc?id=FILE_ID
  m = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://lh3.googleusercontent.com/d/FILE_ID
  m = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // https://drive.google.com/thumbnail?id=FILE_ID
  m = url.match(/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

function isDriveUrl(url) {
  return url.includes("drive.google.com") || url.includes("docs.google.com/uc") || url.includes("googleusercontent.com/d/");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  var url = searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return new Response("Missing or invalid url param", { status: 400 });
  }

  // Convert Google Drive URLs to direct thumbnail
  if (isDriveUrl(url)) {
    var fileId = extractDriveId(url);
    if (fileId) {
      url = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";
    }
  }

  try {
    var res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": url,
      },
      redirect: "follow",
    });

    // Fallback: try uc?export=view
    if (!res.ok && isDriveUrl(url)) {
      var fallbackId = extractDriveId(url);
      if (fallbackId) {
        res = await fetch("https://drive.google.com/uc?export=view&id=" + fallbackId, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*,*/*;q=0.8" },
          redirect: "follow",
        });
      }
    }

    if (!res.ok) return new Response("Image not found", { status: 404 });
    var blob = await res.blob();
    var ct = res.headers.get("content-type") || "image/jpeg";
    if (ct.includes("text/html")) {
      return new Response("Image requires public sharing in Drive", { status: 403 });
    }
    return new Response(blob, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response("Fetch error: " + e.message, { status: 500 });
  }
}
