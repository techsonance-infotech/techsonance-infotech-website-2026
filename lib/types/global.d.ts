import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

declare module "nomnoml" {
  export function renderSvg(source: string): string;
  const nomnoml: {
    renderSvg(source: string): string;
  };
  export default nomnoml;
}

