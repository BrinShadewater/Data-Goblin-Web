/// <reference types="vite/client" />

import "react";

declare module "react" {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    /**
     * Lowercase `fetchpriority`, deliberately.
     *
     * React 18's *types* accept the camelCase `fetchPriority`, but its DOM
     * runtime does not forward it — every render of the landing hero, the map
     * and the About art logged "React does not recognize the fetchPriority
     * prop... spell it as lowercase fetchpriority instead", and the attribute
     * never reached the HTML, so the priority hint did nothing. React 18 does
     * pass unknown *lowercase* attributes straight through, so the lowercase
     * spelling is what actually works; it just isn't in the 18 typings yet.
     *
     * Remove this augmentation when the app moves to React 19, where
     * `fetchPriority` works at runtime.
     */
    fetchpriority?: "high" | "low" | "auto";
  }
}
