import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  onEscape?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  disableRestoreFocus?: boolean;
}

/**
 * Custom accessible dialog hook providing:
 * 1. Initial focus management (first focusable element or initialFocusRef).
 * 2. Focus containment/trapping within the modal/drawer on Tab and Shift+Tab.
 * 3. Escape key dismiss handling.
 * 4. Focus restoration to the triggering element upon close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  onEscape,
  initialFocusRef,
  disableRestoreFocus = false,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture the trigger element that had focus before opening
    if (document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    const getFocusables = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
    };

    // Move focus into the active dialog
    const focusTimer = window.setTimeout(() => {
      if (initialFocusRef?.current && container.contains(initialFocusRef.current)) {
        initialFocusRef.current.focus();
      } else {
        const focusables = getFocusables();
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          container.setAttribute('tabindex', '-1');
          container.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      const dismissHandler = onEscape || onClose;
      if (e.key === 'Escape' && dismissHandler) {
        e.preventDefault();
        e.stopPropagation();
        dismissHandler();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusables();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);

      if (!disableRestoreFocus && previouslyFocusedElementRef.current) {
        const prev = previouslyFocusedElementRef.current;
        if (document.body.contains(prev)) {
          window.setTimeout(() => {
            if (document.body.contains(prev)) {
              prev.focus();
            }
          }, 0);
        }
      }
    };
  }, [isOpen, onClose, onEscape, initialFocusRef, disableRestoreFocus]);

  return containerRef;
}
