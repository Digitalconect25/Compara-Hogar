// Convierte URLs de Amazon a proxy local para evitar bloqueo de hotlinking
export function proxyImg(url) {
  if (!url) return "/placeholder.svg";
  if (url.includes("media-amazon.com") || url.includes("ssl-images-amazon.com")) {
    return `/api/img?url=${encodeURIComponent(url)}`;
  }
  return url;
}
