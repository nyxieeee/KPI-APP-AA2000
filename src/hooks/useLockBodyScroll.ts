import { useEffect } from 'react';

type Options = {
  /** If true, preserves layout by compensating for scrollbar width. Default: true */
  compensateScrollbar?: boolean;
};

/**
 * Locks document scrolling while `locked` is true.
 *
 * When the app scrolls inside `<main>` (common in this project), locking `body` with
 * `position: fixed` + `window.scrollY` leaves that scroll container in a bad state after
 * unlock. Prefer locking the scrollable `main` element instead.
 */
export function useLockBodyScroll(locked: boolean, opts: Options = {}) {
  const { compensateScrollbar = true } = opts;

  useEffect(() => {
    if (!locked) return;
    if (typeof window === 'undefined') return;
    if (typeof document === 'undefined') return;

    const main = document.querySelector('main');
    if (main) {
      const overflowY = getComputedStyle(main).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const prevOverflow = main.style.overflow;
        const scrollTop = main.scrollTop;
        main.style.overflow = 'hidden';
        return () => {
          main.style.overflow = prevOverflow;
          main.scrollTop = scrollTop;
        };
      }
    }

    const body = document.body;
    const html = document.documentElement;

    const scrollY = window.scrollY || window.pageYOffset || 0;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevHtmlOverscroll = (html.style as any).overscrollBehaviorY as string | undefined;

    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    if (compensateScrollbar && scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    // Prevent iOS overscroll/scroll chaining.
    (html.style as any).overscrollBehaviorY = 'none';

    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.paddingRight = prevBodyPaddingRight;
      (html.style as any).overscrollBehaviorY = prevHtmlOverscroll || '';

      window.scrollTo(0, scrollY);
    };
  }, [locked, compensateScrollbar]);
}

