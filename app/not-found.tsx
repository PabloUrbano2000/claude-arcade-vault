import Link from "next/link";

export default function NotFound() {
  return (
    <section className="av-404 fade-in">
      <div className="crt av-404-tv" aria-hidden="true">
        <div className="crt-screen">
          <div className="av-404-static"></div>
          <div className="crt-content">
            <div>
              <div className="pixel neon-magenta av-404-signal">SIN SEÑAL</div>
              <div className="pixel av-404-channel">CANAL 404</div>
            </div>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led av-404-led">SIN SEÑAL</span>
          <span>CRT-83</span>
        </div>
      </div>

      <h1 className="pixel neon-cyan av-404-title">JUEGO NO ENCONTRADO</h1>
      <p className="av-404-text">
        Ese cartucho no está en el vault. Revisa el enlace o elige otro juego de la biblioteca.
      </p>
      <Link href="/games" className="btn lg">
        VOLVER A LA BIBLIOTECA
      </Link>
    </section>
  );
}
