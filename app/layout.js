import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SITE = {
  name: "ComparaHogar",
  url: "https://comparahogar.es",
  locale: "es_ES",
  lang: "es",
  company: "Digital Conect",
  email: "info.digitalconect@gmail.com",
  city: "Alicante",
  region: "Comunidad Valenciana",
  country: "ES",
  lat: "38.3452",
  lng: "-0.4815",
};

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "ComparaHogar.es - Comparativas honestas de hogar inteligente 2026",
    template: "%s | ComparaHogar.es",
  },
  description: "Comparativas y analisis reales de robots aspiradores, altavoces inteligentes, camaras de seguridad WiFi, iluminacion smart y domotica. Probamos cada producto durante semanas en Alicante. Guias de compra actualizadas marzo 2026.",
  keywords: [
    "hogar inteligente", "domotica", "smart home espana",
    "robot aspirador comparativa 2026", "mejor robot aspirador", "roborock s8 maxv ultra opinion",
    "dreame l10s ultra gen 2", "altavoz inteligente alexa", "amazon echo dot 5",
    "camara seguridad wifi sin suscripcion", "tapo c320ws", "philips hue starter kit",
    "enchufes inteligentes tapo p110", "termostato inteligente tado",
    "comparahogar", "analisis productos hogar",
  ],
  authors: [{ name: SITE.company, url: SITE.url }],
  creator: SITE.company,
  publisher: SITE.company,
  formatDetection: { email: false, telephone: false },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: "ComparaHogar.es - Comparativas honestas de hogar inteligente",
    description: "Analisis reales de robots aspiradores, altavoces, camaras y domotica. Probamos cada producto durante semanas.",
  },
  twitter: { card: "summary_large_image", title: "ComparaHogar.es", description: "Comparativas honestas de tecnologia para tu hogar inteligente" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: { canonical: SITE.url },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: SITE.url + "/icon.svg",
  contactPoint: { "@type": "ContactPoint", email: SITE.email, contactType: "customer service", areaServed: "ES", availableLanguage: "Spanish" },
  address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
  sameAs: [],
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: metadata.description,
  publisher: { "@type": "Organization", name: SITE.company },
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: SITE.url + "/buscar?q={search_term_string}" }, "query-input": "required name=search_term_string" },
};

export default function RootLayout({ children }) {
  return (
    <html lang={SITE.lang}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="geo.region" content={`${SITE.country}-VC`} />
        <meta name="geo.placename" content={SITE.city} />
        <meta name="geo.position" content={`${SITE.lat};${SITE.lng}`} />
        <meta name="ICBM" content={`${SITE.lat}, ${SITE.lng}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
