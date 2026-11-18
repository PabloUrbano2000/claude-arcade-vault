// Suspense boundary for game routes. Known ids are fully prerendered and never show it;
// unknown ids (resolved at request time) keep the nav/footer shell while notFound() streams in.
export default function Loading() {
  return <div style={{ minHeight: "60vh" }} aria-busy="true" />;
}
