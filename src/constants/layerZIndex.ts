/**
 * Stacking order: page content (z-0) < FAB/toasts < popups/modals.
 * Keep interactive overlays at or above Z_POPUP so they stay above audit bars and cards.
 */
export const Z_FAB = 14000;
export const Z_TOAST_INLINE = 14500;
export const Z_POPUP = 15000;
