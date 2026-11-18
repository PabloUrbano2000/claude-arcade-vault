# SPEC 02 — Home (landing) de Arcade Vault y Biblioteca en /games

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-18
> **Objetivo:** Reemplazar la portada `/` por la landing de `references/templates/home-about/home.jsx` y mover la Biblioteca actual a `/games`, con fidelidad visual a la referencia.

---

## Por qué existe esta spec

La referencia nueva (`references/templates/home-about/`) agrega una landing de marketing como portada y la pantalla About. La Biblioteca deja de ser la portada y pasa a una ruta propia. About se trata en otra spec para que esta solo toque la home, el nav y las rutas que cambian con ella.

La `SPEC 01` está marcada como `Implementado`, pero en el repo solo existen `/` y `/juegos/[id]`. Faltan `/juegos/[id]/jugar`, `/login` y `/salon-de-la-fama`. Esta spec enlaza a `/login` y `/salon-de-la-fama` igualmente. Esas rutas mostrarán la 404 hasta que se complete la `SPEC 01`.

---

## Alcance

**Dentro:**

- Nueva home en `/` con las secciones de `home.jsx`, en este orden:
  - Hero: siluetas pixel flotantes (8 SVG), eyebrow «▸ INSERTA UNA MONEDA_», título en 3 líneas, subtítulo, CTAs «▶ EXPLORAR JUEGOS» y «✦ CREAR CUENTA», indicador «DESLIZA ▼».
  - `// 01` ¿POR QUÉ ARCADE VAULT?: 4 tarjetas con icono pixel (GAMEPAD, FREE, TROPHY, ROCKET).
  - `// 02` JUEGOS DISPONIBLES AHORA: 6 mini-tarjetas (`GAMES.slice(0, 6)`) y botón «VER TODOS LOS JUEGOS →».
  - Banda de estadísticas: «12+ JUEGOS», «MILES DE PARTIDAS», «GLOBAL RANKING».
  - `// 03` ACTIVIDAD EN VIVO: «ÚLTIMAS PUNTUACIONES» (7 filas) y «TOP JUGADORES · HOY» (5 filas con barra) con enlace «VER SALÓN →».
  - `// 04` PRECIOS: tarjeta «JUGADOR VAULT $0» con sello «FREE PLAY» y 3 preguntas frecuentes.
  - CTA final «¿LISTO PARA JUGAR?» con botón «INSERTAR MONEDA →».
- Animación de aparición al hacer scroll (`.reveal` → `.reveal.in`) con `IntersectionObserver`, como la referencia.
- Con `prefers-reduced-motion: reduce`, las secciones `.reveal` se muestran visibles y sin transición.
- Datos de la home fijos, copiados tal cual de `home.jsx` y tipados en `lib/home-data.ts`.
- La Biblioteca actual (hero «ARCADE VAULT», buscador, chips, grilla) se mueve sin cambios de `/` a `/games`.
- Nav: se agrega el enlace «Inicio» (`/`) antes de «Biblioteca», en la barra y en el panel móvil. El logo apunta a `/`. «Biblioteca» apunta a `/games`.
- Estado activo del nav: «Inicio» en `/`. «Biblioteca» en `/games`, `/juegos/<id>` y `/juegos/<id>/jugar`.
- Destinos de los enlaces:
  - «EXPLORAR JUEGOS», «VER TODOS LOS JUEGOS →» e «INSERTAR MONEDA →» → `/games`.
  - «CREAR CUENTA» y «EMPEZAR GRATIS →» → `/login`.
  - «VER SALÓN →» → `/salon-de-la-fama`.
  - Mini-tarjeta → `/juegos/<id>`.
  - «VOLVER AL VAULT» del detalle → `/games`.
  - «VOLVER A LA BIBLIOTECA» de la 404 → `/games` (mismo texto).
- Estilos de la home portados a `app/globals.css` desde `references/templates/home-about/styles.css`: bloques `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING`.

**Fuera de alcance (para specs futuras):**

- Pantalla About (`about.jsx`), su ruta y el enlace «Acerca de» del nav.
- Estilos de About de la referencia: bloques `ABOUT PAGE`, `GAMEPAD` y `Theme variants`.
- Completar la `SPEC 01`: reproductor, `/login` y `/salon-de-la-fama`.
- Datos reales o derivados en la home: últimas puntuaciones desde `av_scores`, top desde `seededScores` o contadores reales.
- Abrir `/login` directamente en la pestaña «CREAR CUENTA».
- Redirección de rutas antiguas: `/` no redirige a `/games`, simplemente cambia de contenido.
- Renombrar `/games` a español o mover `/juegos/[id]` bajo `/games`.

---

## Modelo de datos

Los juegos de la sección `// 02` salen de `GAMES` (`lib/data.ts`, `SPEC 01`). El resto son datos fijos nuevos:

```ts
// lib/home-data.ts
import type { GameColor } from "@/lib/data";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export interface Feature {
  icon: FeatureIconKind;
  title: string;        // "JUEGOS CLÁSICOS"
  desc: string;
  color: GameColor;     // clase de .feature-card: cyan | yellow | magenta | green
}

export interface HomeStat {
  value: string;        // "12+", "MILES", "GLOBAL"
  unit: string;         // "JUEGOS"
  sub: string;          // "Y CONTANDO"
}

export interface RecentScore {
  player: string;       // "NEONFOX"
  game: string;         // título visible: "Caída"
  score: number;        // se muestra como "+184.220"
  ago: string;          // "hace 2 min"
  color: GameColor;     // clase neon-<color> del nombre
}

export interface TopPlayer {
  rank: number;         // 1..5
  player: string;
  score: number;
}

export const FEATURES: Feature[];           // 4 entradas, textos de home.jsx
export const HOME_STATS: HomeStat[];        // 3 entradas
export const RECENT_SCORES: RecentScore[];  // 7 entradas
export const TOP_PLAYERS: TopPlayer[];      // 5 entradas
```

Convenciones (iguales a la referencia):

- Números con `toLocaleString("es-ES")`.
- Ancho de la barra del top: `100 - índice * 16` en %.
- Retardos escalonados: `transitionDelay` de 80 ms por tarjeta de feature y de 90 ms por bloque de estadísticas; `animationDelay` de 60 ms por fila del ticker.
- Los textos de precios y preguntas frecuentes van directamente en el JSX de la sección; no son datos.

No hay persistencia nueva. No se tocan `av_user` ni `av_scores`.

---

## Plan de implementación

1. **Estilos.** Copiar a `app/globals.css`, dentro de `@layer components`, los bloques `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/styles.css`. Agregar la regla de `prefers-reduced-motion` para `.reveal`. Verificación: `/` y `/juegos/<id>` se ven igual que antes.
2. **Mover la Biblioteca.** Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero + `<Library />`). Dejar temporalmente `app/page.tsx` igual. Verificación: `/games` muestra la Biblioteca completa.
3. **Datos de la home.** Crear `lib/home-data.ts` con los tipos y las 4 constantes del modelo de datos. Verificación: `npm run build` sin errores de tipos.
4. **Piezas decorativas.** Crear `components/home/floating-silhouettes.tsx` (las 8 siluetas SVG) y `components/home/feature-icon.tsx` (los 4 iconos pixel). Ambos son Server Components sin estado.
5. **Animación de scroll.** Crear `components/home/reveal-observer.tsx` (`"use client"`, no renderiza nada). Al montar observa todos los `.reveal`, les agrega `in` al entrar en pantalla (`threshold: 0.12`) y se desconecta al desmontar.
6. **Home, primera mitad.** Reemplazar `app/page.tsx` por la landing: hero, sección `// 01`, sección `// 02` con mini-tarjetas como `Link` a `/juegos/<id>`, y banda de estadísticas. Montar `<RevealObserver />`. CTAs como `Link` con clases `btn`. Verificación: `/` muestra esas secciones y aparecen al hacer scroll.
7. **Home, segunda mitad.** Agregar `// 03` ACTIVIDAD EN VIVO, `// 04` PRECIOS y el CTA final. Verificación: la home completa coincide con la referencia a ojo.
8. **Nav y enlaces.** En `components/nav.tsx`: agregar «Inicio» (barra y panel móvil), apuntar «Biblioteca» a `/games` y actualizar el estado activo. En `app/juegos/[id]/page.tsx`, «VOLVER AL VAULT» → `/games`. En `app/not-found.tsx`, el botón → `/games`.
9. **Ajustes.** `npm run build` y `npm run lint` sin errores. Revisar que no haya avisos de hidratación ni de Cache Components en consola. Compararlo con Playwright contra la referencia según los criterios de aceptación.

Antes de usar una API de Next (`Link`, `usePathname`, metadatos de página), consultar `node_modules/next/dist/docs/`, como indica AGENTS.md. Para el trabajo visual usar la skill `/frontend-design`, como indica CLAUDE.md.

Para la comparación visual, servir `references/templates/home-about/` con un servidor HTTP local y abrir `arcade-vault-standalone.html`.

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores de tipos.
- [ ] `npm run lint` sobre `app`, `components` y `lib` termina sin errores.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en `/` ni en `/games`.
- [ ] `/` muestra el título «EL ARCADE / CLÁSICO ESTÁ / DE VUELTA» y los botones «▶ EXPLORAR JUEGOS» y «✦ CREAR CUENTA».
- [ ] `/` muestra las secciones `// 01`, `// 02`, `// 03` y `// 04`, la banda de estadísticas y el CTA final, en ese orden.
- [ ] La sección `// 01` tiene 4 tarjetas, cada una con su icono pixel.
- [ ] La sección `// 02` muestra 6 mini-tarjetas: BLOQUE BUSTER, CAÍDA, SERPENTINA, GLOTÓN, INVASORES y ROCAS.
- [ ] «ÚLTIMAS PUNTUACIONES» tiene 7 filas y la primera es «NEONFOX ▸ Caída +184.220 hace 2 min».
- [ ] «TOP JUGADORES · HOY» tiene 5 filas y la primera es «#01 NEONFOX 312.840».
- [ ] Al cargar `/`, las secciones bajo el hero están ocultas y aparecen con fade al entrar en pantalla.
- [ ] Con `prefers-reduced-motion: reduce` emulado, todas las secciones son visibles sin hacer scroll.
- [ ] «EXPLORAR JUEGOS», «VER TODOS LOS JUEGOS →» e «INSERTAR MONEDA →» navegan a `/games`.
- [ ] «CREAR CUENTA» y «EMPEZAR GRATIS →» navegan a `/login`.
- [ ] «VER SALÓN →» navega a `/salon-de-la-fama`.
- [ ] Pulsar una mini-tarjeta navega a `/juegos/<id>`.
- [ ] `/games` muestra el hero «ARCADE VAULT», el buscador, 5 chips y 8 tarjetas, igual que la antigua `/`.
- [ ] El nav muestra «Inicio», «Biblioteca» y «Salón de la Fama», en ese orden, en la barra y en el panel móvil.
- [ ] El logo navega a `/`.
- [ ] «Inicio» está activo solo en `/`; «Biblioteca» está activo en `/games` y `/juegos/<id>`.
- [ ] «VOLVER AL VAULT» en `/juegos/<id>` navega a `/games`.
- [ ] El botón «VOLVER A LA BIBLIOTECA» de la 404 navega a `/games`.
- [ ] Comparación con Playwright de `/` contra `arcade-vault-standalone.html` a 1440 px y 390 px: 0 diferencias de estilos y cajas en la home, excepto en el nav por el enlace «Acerca de» que no se incluye.

---

## Decisiones

- **Sí:** Biblioteca en `/games`, como pidió el usuario.
- **No:** `/juegos`. Era más consistente con `/juegos/[id]` y el resto de rutas en español, pero el usuario eligió `/games`.
- **Sí:** solo «Inicio» en el nav. «Acerca de» llega con la spec de About, sin enlaces rotos mientras tanto.
- **No:** agregar «Acerca de» ya. Llevaría a una 404 hasta que exista la ruta.
- **Sí:** datos de la home fijos, iguales a la referencia, en `lib/home-data.ts`. Fidelidad visual exacta y sin lógica nueva.
- **No:** derivar actividad y top de `av_scores` o `seededScores`. El resultado cambiaría y no coincidiría con la referencia; va en otra spec.
- **Sí:** enlazar a `/login` y `/salon-de-la-fama` aunque aún no existan. Se completan en la `SPEC 01`.
- **No:** bloquear esta spec hasta terminar la `SPEC 01`, ni incluir esas pantallas aquí. Haría la spec demasiado grande.
- **Sí:** «VOLVER AL VAULT» y el botón de la 404 llevan a `/games`. Ambos hablan de la biblioteca o de elegir otro juego.
- **Sí:** login e invitado, cuando se implementen en la `SPEC 01`, redirigen a `/` (la nueva home).
- **Sí:** animación de scroll con `IntersectionObserver` y respeto de `prefers-reduced-motion`. Igual que la referencia y accesible.
- **Sí:** página de la home como Server Component. Solo `RevealObserver` es cliente. Aprovecha `cacheComponents` y el prerenderizado.
- **Sí:** mini-tarjetas y CTAs como `Link` en vez de `div`/`button` con `onClick`. Navegación nativa y prefetch; los estilos se ajustan para que se vean igual.
- **Sí:** portar solo los bloques CSS de la home. Los de About llegan con su spec.
- **Sí:** verificación con Playwright contra `arcade-vault-standalone.html`, igual que se verificó la Biblioteca.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Las secciones `.reveal` quedan invisibles si el JS no carga o falla la hidratación. | El hero no usa `.reveal`. Con `prefers-reduced-motion` todo es visible. Se acepta para el resto, igual que la referencia. |
| `Link` renderiza `<a>` en vez de `div`/`button`, y cambia estilos por defecto (alineación, color, display). | `.btn` ya fuerza `text-align: center` y `a { color: inherit }` está en la base. La comparación con Playwright detecta cualquier diferencia. |
| El reset de Tailwind cambia valores por defecto de `h1`, `h2`, `ul`, `button` e `input` en los estilos nuevos (ya pasó con el hero de la Biblioteca). | Comparar estilos computados con Playwright y restaurar los valores del navegador donde haga falta. |
| `/login` y `/salon-de-la-fama` muestran la 404 hasta completar la `SPEC 01`. | Riesgo aceptado. Queda registrado en «Por qué existe esta spec». |
| Turbopack a veces no recarga cambios de `app/globals.css` en dev. | Si un cambio no aparece, tocar el archivo o reiniciar `npm run dev` antes de comparar. |
| La referencia es un HTML empaquetado y no se puede leer como código. | Para fidelidad usar `home.jsx` y `styles.css`. El HTML empaquetado solo se usa para la comparación visual. |

---

## Qué **no** entra en esta spec

- Pantalla About, su ruta y el enlace «Acerca de».
- Completar la `SPEC 01` (reproductor, acceso y Salón de la Fama).
- Datos reales en la actividad, el top o las estadísticas de la home.
- Abrir `/login` en la pestaña «CREAR CUENTA».
- Redirecciones o renombrado de rutas.

Cada uno de estos, si llega, va en su propia spec.
