export default function Home() {
  return (
    <main className="av-main">
      <section className="av-hero">
        <h1>Arcade Vault</h1>
        <p className="sub">
          Inserta una moneda <span className="blink">▮</span>
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="btn lg pulse">Jugar ahora</button>
          <button className="btn magenta lg">Ver salón de la fama</button>
        </div>
      </section>
    </main>
  );
}
