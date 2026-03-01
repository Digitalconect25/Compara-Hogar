import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Pagina no encontrada</h2>
      <p>Lo que buscas no existe o se ha movido a otra direccion</p>
      <Link href="/">Volver al inicio</Link>
    </div>
  );
}
