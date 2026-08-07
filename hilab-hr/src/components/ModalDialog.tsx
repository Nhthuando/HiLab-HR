"use client";

import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ModalDialogProps {
  titleId: string;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function ModalDialog({
  titleId,
  onClose,
  initialFocusRef,
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const getFocusableElements = useCallback(
    () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    ),
    [],
  );

  useEffect(() => {
    const returnFocusTarget = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const initialTarget = initialFocusRef?.current ?? getFocusableElements()[0];
      initialTarget?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      if (returnFocusTarget?.isConnected) {
        returnFocusTarget.focus();
      }
    };
  }, [getFocusableElements, initialFocusRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [getFocusableElements]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {children}
      </div>
    </div>
  );
}
