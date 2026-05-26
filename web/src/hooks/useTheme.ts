import { useEffect } from 'react';
import { useAuthStore } from '../lib/store/auth';

export function useTheme() {
  const theme = useAuthStore((s) => s.user?.theme ?? 'auto');

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const apply = (e: MediaQueryList | MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
      };
      apply(mq);
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }

    root.setAttribute('data-theme', theme);
  }, [theme]);
}
