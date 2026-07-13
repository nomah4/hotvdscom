import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// SPA navigation keeps the previous scroll position; reset it on route change
// and honor #hash targets (e.g. the pricing configurator CTAs link to it).
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
