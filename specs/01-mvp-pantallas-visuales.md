# SPEC 01 — MVP visual de las pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-11-17
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) con fidelidad visual y el mismo comportamiento simulado de la plantilla.

---

## Por qué existe esta spec

La plantilla es un prototipo SPA (React UMD + Babel en el navegador, router por hash, todo en `window.*`). Hay que llevarla al stack real del proyecto (Next 16.4, React 19.3, TypeScript strict, `cacheComponents: true`) sin cambiar lo que se ve. Los estilos ya están migrados: todo `references/templates/styles.css` vive en `app/globals.css`, así que esta spec trata de estructura, rutas y componentes, no de CSS nuevo.

---

## Alcance

**Dentro:**

- Datos mock tipados en `lib/data.ts`: `GAMES`, `CATS`, `seededScores()` con los mismos valores y el mismo algoritmo de semilla que `data.jsx`.
- Rutas reales de App Router:
  - `/` → Biblioteca (hero, buscador, chips de categoría, grilla de tarjetas con efecto tilt, estado “NO HAY RESULTADOS”).
  - `/juegos/[id]` → Detalle (portada, tags, descripción, stat-strip, acciones y leaderboard de 10 filas).
  - `/juegos/[id]/jugar` → Reproductor (HUD, CRT con arena decorativa, timer que suma puntos, subida de nivel, PAUSA/REANUDAR, FIN → modal con guardado de puntuación, JUGAR DE NUEVO, VOLVER AL VAULT, SALIR).
  - `/login` → Acceso (pestañas INICIAR SESIÓN / CREAR CUENTA, campo email solo en “crear”, JUGAR COMO INVITADO, botones sociales decorativos).
  - `/salon-de-la-fama` → Salón de la Fama (pestañas por juego, podio 1-2-3, tabla de 12 filas, fila “TU MEJOR MARCA” si hay usuario, botón volver).
- `Nav` común en el layout: logo, enlaces con estado activo (Biblioteca activa también en detalle y reproductor), contador “CRÉDITOS · 03”, botón de sesión y panel móvil (hamburguesa + backdrop).
- Footer común con el texto de la plantilla.
- Sesión y puntuaciones simuladas con `localStorage`, igual que la plantilla (`av_user`, `av_scores`).
- Juego inexistente → `notFound()` + `app/not-found.tsx` con estilo arcade.
- Sustituir el `app/page.tsx` actual (placeholder) por la Biblioteca.

**Fuera de alcance (para specs futuras):**

- Juegos jugables reales (la lógica de cada juego).
- Autenticación real, OAuth Google/GitHub y cualquier backend o base de datos.
- Salón de la Fama y leaderboards con puntuaciones reales (leer `av_scores` en vez de `seededScores`).
- Menú de usuario (`▾`) funcional: el botón con el nombre solo cierra sesión, como en la plantilla.
- Créditos funcionales: “CRÉDITOS · 03” es un texto fijo.
- Tests automatizados / E2E.
- Reescribir los estilos en utilidades Tailwind.

---

## Modelo de datos

```ts
// lib/data.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | Category;
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;        // slug usado en la URL: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;     // clase CSS de globals.css: "cover-bricks", "cover-tetro", ...
  color: GameColor;
  best: number;
  plays: string;     // "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;      // "DD/MM/2026"
}

export const GAMES: Game[];                 // los 8 juegos de data.jsx, sin cambios
export const CATS: CategoryFilter[];        // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[]; // mismo algoritmo que la plantilla
```

```ts
// lib/session.ts (cliente)
export interface User { name: string }      // nombre en mayúsculas, máx. 10 caracteres

export interface SavedScore {
  game: string;   // Game.id
  score: number;
  name: string;
  at: number;     // Date.now()
}
```

Claves de `localStorage` (las mismas que la plantilla, sin versionado porque los datos son desechables en el MVP):

- `av_user` → `User | null` en JSON.
- `av_scores` → `SavedScore[]` en JSON.

Convenciones:

- Semillas iguales a la plantilla: Detalle usa `seededScores(id.length * 17 + 3, 10)`; Salón usa `seededScores(id.length * 23 + 7, 12)`.
- Números formateados con `toLocaleString("es-ES")`.
- La lectura de `localStorage` ocurre solo en el cliente después de montar (sin acceso durante SSR) para evitar diferencias de hidratación; mientras tanto el usuario se trata como `null`.

---

## Plan de implementación

1. **Datos.** Crear `lib/data.ts` con los tipos, `GAMES`, `CATS`, `getGame()` y `seededScores()` portados de `data.jsx`. Verificación: `npm run build` sin errores de tipos.
2. **Sesión.** Crear `lib/session.ts` (helpers de lectura y escritura de `av_user` / `av_scores` con `try/catch`) y `components/session-provider.tsx` (`"use client"`, Context con `user`, `login(user)`, `signOut()`, `saveScore(entry)`). Montarlo en `app/layout.tsx` alrededor de `.av-root`.
3. **Layout común.** Crear `components/nav.tsx` (`"use client"`, `usePathname` para el estado activo, panel móvil, `Link` de `next/link`) y `components/footer.tsx`. Integrarlos en `app/layout.tsx` con `<main className="av-main">{children}</main>`. La página placeholder actual sigue funcionando.
4. **Biblioteca.** Crear `components/game-card.tsx` (`"use client"`, tilt con `ref`, navegación a `/juegos/[id]`) y `components/library.tsx` (`"use client"`, búsqueda + chips + grilla + estado vacío). Reemplazar `app/page.tsx` para que renderice el hero y `<Library />`. Prueba manual: filtrar por “PUZZLE” muestra solo CAÍDA; buscar “zzz” muestra “NO HAY RESULTADOS”.
5. **Detalle.** Crear `app/juegos/[id]/page.tsx` (Server Component, `params` asíncrono, `generateStaticParams` desde `GAMES`, `notFound()` si `getGame` devuelve `undefined`) con portada, info, stat-strip, acciones y leaderboard. Crear `app/not-found.tsx` con estilo arcade y enlace a `/`. Prueba manual: `/juegos/caida` renderiza; `/juegos/xyz` muestra la 404.
6. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` (Server Component: valida el juego, `generateStaticParams`, `notFound()`) que renderiza `components/game-player.tsx` (`"use client"`: HUD, CRT, timer de 220 ms, pausa, nivel, modal de fin, guardar puntuación vía `saveScore`, reinicio, salir a `/juegos/[id]`). Prueba manual: la puntuación sube; PAUSA la congela; FIN abre el modal; GUARDAR escribe en `av_scores` y muestra “PUNTUACIÓN GUARDADA”.
7. **Acceso.** Crear `app/login/page.tsx` que renderiza `components/auth-form.tsx` (`"use client"`: pestañas, formulario, `login({ name })` con fallback `PLAYER1`, invitado → `login(null)`; ambos navegan a `/` con `useRouter`). Prueba manual: entrar como “px_kai” hace que el nav muestre “PX_KAI ▾”; pulsarlo cierra la sesión.
8. **Salón de la Fama.** Crear `app/salon-de-la-fama/page.tsx` que renderiza `components/hall-of-fame.tsx` (`"use client"`: pestañas por juego, podio, tabla con `animationDelay`, fila “TU MEJOR MARCA” solo con usuario, botón volver a `/`).
9. **Ajustes.** Revisar que Next no muestre avisos de Cache Components / Suspense en `npm run dev` y `npm run build`; si los hay, envolver en `<Suspense>` las partes cliente que lo requieran. Ejecutar `npm run lint` y corregir.

Antes de cada paso que use una API de Next (`params`, `generateStaticParams`, `notFound`, `not-found.tsx`, `usePathname`, `useRouter`), consultar `node_modules/next/dist/docs/`, como indica AGENTS.md. Para el trabajo visual (en especial `app/not-found.tsx`, que no existe en la plantilla), usar la skill `/frontend-design`, como indica CLAUDE.md.

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni advertencias de tipos.
- [ ] `npm run lint` termina sin errores.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en ninguna de las 5 rutas.
- [ ] `/` muestra el hero “ARCADE VAULT”, el buscador, 5 chips y 8 tarjetas.
- [ ] El chip “SHOOTER” deja exactamente 2 tarjetas (INVASORES, ROCAS).
- [ ] Buscar “zzz” muestra “NO HAY RESULTADOS”.
- [ ] Al pasar el ratón por una tarjeta, esta se inclina (tilt) y vuelve a su sitio al salir.
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/bloque-buster` muestra título, 4 tags, stat-strip y un leaderboard de 10 filas con estilos top1/top2/top3.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la 404 con estilo arcade.
- [ ] “▶ JUGAR AHORA” navega a `/juegos/<id>/jugar`.
- [ ] En el reproductor la puntuación sube sola; PAUSA la congela y muestra “EN PAUSA”; REANUDAR continua.
- [ ] FIN abre el modal “FIN DEL JUEGO” con la puntuación final.
- [ ] GUARDAR PUNTUACIÓN añade una entrada `{ game, score, name, at }` a `av_scores` y muestra “▸ PUNTUACIÓN GUARDADA_”.
- [ ] JUGAR DE NUEVO reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] SALIR vuelve a `/juegos/<id>`.
- [ ] En `/login`, la pestaña CREAR CUENTA muestra el campo de correo e INICIAR SESIÓN lo oculta.
- [ ] Entrar con usuario “px_kai” guarda `{"name":"PX_KAI"}` en `av_user`, redirige a `/` y el nav muestra “PX_KAI ▾”.
- [ ] Recargar la página mantiene la sesión; pulsar “PX_KAI ▾” la cierra y vuelve a aparecer “Iniciar Sesión”.
- [ ] JUGAR COMO INVITADO redirige a `/` sin sesión.
- [ ] `/salon-de-la-fama` muestra 8 pestañas, el podio con 3 puestos y una tabla de 12 filas; cambiar de pestaña cambia los nombres.
- [ ] Con sesión iniciada aparece la fila “▸ TU MEJOR MARCA EN <JUEGO>”; sin sesión no aparece.
- [ ] El enlace “Biblioteca” del nav está activo en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`; “Salón de la Fama” está activo en `/salon-de-la-fama`.
- [ ] A 375 px de ancho aparece la hamburguesa; abre el panel lateral, y tocar el backdrop o un enlace lo cierra.
- [ ] Recorrido manual: cada pantalla coincide visualmente con `references/templates/Arcade Vault.html` en escritorio y en móvil.

---

## Decisiones

- **Sí:** rutas reales en español (`/juegos/[id]`, `/juegos/[id]/jugar`, `/login`, `/salon-de-la-fama`). Deep-links nativos, `Link`, y es idiomático en App Router.
- **No:** replicar el router por hash de la plantilla en una SPA cliente. Va contra el modelo de Next y rompe el prerenderizado.
- **No:** rutas en inglés. La UI y el contenido están en español.
- **Sí:** replicar la sesión y las puntuaciones con `localStorage` (`av_user`, `av_scores`). Mantiene el comportamiento de la plantilla sin backend.
- **No:** UI sin estado ni Context solo en memoria. Perderían el feedback visual (nombre en el nav, fila “TU MEJOR MARCA”) o no sobrevivirían a una recarga.
- **Sí:** reproductor simulado (timer que suma puntos, arena decorativa) igual que la plantilla. Los juegos reales van en specs propias.
- **Sí:** datos tipados en `lib/data.ts`, importables desde Server Components.
- **No:** JSON estático. Pierde los tipos y obliga a separar el generador de puntuaciones.
- **Sí:** componentes en `components/` reutilizando las clases ya portadas en `app/globals.css`; Tailwind solo para estilos inline sueltos.
- **No:** reescribir todo en Tailwind. Mucho más trabajo y riesgo de desviarse visualmente sin ganar nada en un MVP visual.
- **Sí:** `notFound()` + `app/not-found.tsx` con estilo arcade. La plantilla no renderiza nada en ese caso, lo que deja una pantalla vacía.
- **Sí:** páginas de ruta como Server Components y la interactividad en componentes cliente hoja. Aprovecha `cacheComponents` y el prerenderizado con `generateStaticParams`.
- **Sí:** verificación con build + lint + recorrido manual. **No:** E2E en esta spec; no hay test runner configurado y añadirlo es otro alcance.

---

## Riesgos identificados

- **Hidratación con `localStorage`:** si `user` se lee durante el render inicial, el HTML del servidor (sin usuario) no coincide con el cliente. Mitigación: leer después de montar (efecto o `useSyncExternalStore` con snapshot de servidor `null`).
- **`cacheComponents: true`:** los accesos dinámicos (`params` sin `generateStaticParams`, APIs de request) fuera de `<Suspense>` hacen fallar el build. Mitigación: `generateStaticParams` en las rutas `[id]` y consultar las guías de `node_modules/next/dist/docs/` antes de implementar.
- **Diferencias con la versión de Next:** las APIs de Next 16.4 pueden no coincidir con lo conocido (p. ej. `params` como `Promise`, `PageProps<...>` global). Mitigación: leer la documentación local en cada paso, como manda AGENTS.md.
- **Timer del reproductor:** un `setInterval` sin limpiar sigue sumando puntos al salir de la página. Mitigación: limpiarlo en el cleanup del efecto, como en la plantilla.
- **Tilt de las tarjetas en dispositivos táctiles:** solo se aplica con `mousemove`; en táctil no hay efecto, lo que es aceptable (igual que la plantilla).
