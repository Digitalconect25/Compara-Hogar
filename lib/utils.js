export function proxyImg(url) {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("/")) return url;
  if (url.startsWith("http")) {
    return "/api/img?url=" + encodeURIComponent(url);
  }
  return url;
}
