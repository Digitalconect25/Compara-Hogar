import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>C</div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17 }}>ComparaHogar</span>
          </div>
          <p>Comparativas honestas de tecnologia para tu hogar inteligente. Probamos cada producto durante semanas en Alicante.</p>
        </div>
        <div className="footer-col">
          <h4>Categorias</h4>
          <Link href="/comparativas/robots-aspiradores">Robots Aspiradores</Link>
          <Link href="/comparativas/altavoces-inteligentes">Altavoces</Link>
          <Link href="/comparativas/camaras-seguridad">Camaras</Link>
          <Link href="/comparativas/iluminacion-wifi">Iluminacion</Link>
          <Link href="/comparativas/enchufes-inteligentes">Enchufes</Link>
          <Link href="/comparativas/climatizacion-smart">Climatizacion</Link>
        </div>
        <div className="footer-col">
          <h4>Contenido</h4>
          <Link href="/comparativas">Comparativas</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/guias">Guias</Link>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <Link href="/privacidad">Politica de privacidad</Link>
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/cookies">Politica de cookies</Link>
          <Link href="/afiliados">Afiliados</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2026 ComparaHogar.es - Digital Conect</span>
        <span>Alicante, Espana</span>
      </div>
    </footer>
  );
}
