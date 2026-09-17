"use client";

import React, { useEffect, useRef } from "react";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  ariaLabel?: string;
  maxWidthClass?: string;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  children: React.ReactNode;
  containerClassName?: string;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  titleId,
  ariaLabel,
  maxWidthClass = "max-w-3xl",
  closeOnEscape = true,
  closeOnBackdropClick = true,
  children,
  containerClassName = "",
}: AccessibleModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on close
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Move focus into the dialog on open
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    // Keyboard handlers: Focus Trap & Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (closeOnEscape) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === "Tab") {
        if (!dialogRef.current) return;

        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previous element on close
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        // Backdrop click to close if clicking outside modal content
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={!titleId ? ariaLabel || "Dialog Window" : undefined}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClass} bg-[#1e1b18] text-[#f6ede0] rounded-2xl border-4 border-[#5a4d3f] shadow-[0_0_60px_rgba(0,0,0,0.95)] max-h-[92vh] overflow-y-auto flex flex-col outline-none ${containerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
