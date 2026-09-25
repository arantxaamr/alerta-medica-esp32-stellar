import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#familias", label: "Para familias" },
  { href: "/#contexto", label: "El contexto" },
  { href: "/#confianza", label: "Confianza" },
];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Pulso, ir al inicio">
      <Image src="/pulso-mark.svg" width={36} height={36} alt="" />
      <span>Pulso<span className="brand-period">.</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="Navegación principal" className="main-nav">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            <Link href="/acceso">Entrar a Pulso</Link>
          </nav>
          <Link className="header-cta" href="/demo">Ver demostración <span aria-hidden="true">↗</span></Link>
          <details className="mobile-menu">
            <summary aria-label="Abrir menú de navegación"><span aria-hidden="true">☰</span> Menú</summary>
            <nav aria-label="Navegación móvil">
              {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
              <Link href="/acceso">Entrar a Pulso</Link>
              <Link href="/demo">Ver demostración</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Brand />
          <p>Tu red de apoyo en dos toques.</p>
          <small>Prototipo en desarrollo · Piloto propuesto en CDMX</small>
        </div>
        <nav className="footer-links" aria-label="Enlaces del sitio">
          <Link href="/acceso">Entrar a Pulso</Link>
          <Link href="/demo">Demostración</Link>
          <Link href="/chequeo">Chequeo diario</Link>
          <Link href="/contactos">Red de contactos</Link>
          <a href="/WHITEPAPER_PULSO.md" download>Descargar white paper (.md)</a>
          <a href="https://github.com/arantxaamr/alerta-medica-esp32-stellar" target="_blank" rel="noopener noreferrer">Repositorio ↗</a>
        </nav>
        <div className="footer-safety">
          <strong>¿Es una emergencia real?</strong>
          <p>En México, llama al 911. Pulso todavía no envía avisos reales ni realiza esa llamada por ti.</p>
          <a href="tel:911">Llamar al 911 ↗</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Pulso · Hecho para familias de Latinoamérica</span>
        <span>Primera etapa: Ciudad de México</span>
      </div>
    </footer>
  );
}

export function AppHeader({ role, name }: { role: "USER" | "FAMILY" | "ADMIN"; name: string }) {
  const roleLabel = role === "ADMIN" ? "Administración" : role === "FAMILY" ? "Red familiar" : "Mi Pulso";
  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="app-header">
      <div className="shell app-header-inner">
        <Brand />
        <nav aria-label="Navegación de la cuenta" className="app-nav">
          <Link href="/panel" aria-current="page">Resumen</Link>
          {role === "USER" && <><Link href="/chequeo">Chequeo diario</Link><Link href="/contactos">Red de apoyo</Link></>}
          <Link href="/demo">Simulador</Link>
        </nav>
        <div className="account-chip"><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{roleLabel}</small></div></div>
      </div>
    </header>
  </>;
}
