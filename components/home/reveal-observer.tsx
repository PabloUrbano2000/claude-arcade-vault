"use client";

import { useEffect } from "react";

/**
 * Adds the `in` class to every `.reveal` element when it scrolls into view,
 * triggering the fade/slide-in defined in globals.css. Renders nothing.
 * With prefers-reduced-motion, CSS already shows `.reveal` without animation.
 */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
