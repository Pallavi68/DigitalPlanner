import { useEffect, useState } from 'react';

/** Tailwind-ish breakpoints. phone < 700, tablet 700–1099, desktop >= 1100. */
export type Viewport = 'phone' | 'tablet' | 'desktop';

export function useViewport(): Viewport {
  const get = (): Viewport => {
    const w = window.innerWidth;
    if (w < 700) return 'phone';
    if (w < 1100) return 'tablet';
    return 'desktop';
  };
  const [vp, setVp] = useState<Viewport>(get);
  useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}
