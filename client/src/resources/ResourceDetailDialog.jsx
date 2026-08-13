import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Badge from "../design-system/primitives/Badge";
import Surface from "../design-system/primitives/Surface";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ResourceDetailDialog({
  resource,
  categoryLabel,
  sourceLabel,
  learnMoreLabel,
  closeLabel,
  onClose,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = `resource-dialog-title-${resource.slug}`;
  const descriptionId = `resource-dialog-description-${resource.slug}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function preserveDialogFocusOnBackdropMouseDown(event) {
    if (event.target === event.currentTarget) event.preventDefault();
  }

  function dismissFromBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div
      className="resources-dialog-backdrop"
      data-testid="resource-dialog-backdrop"
      onMouseDown={preserveDialogFocusOnBackdropMouseDown}
      onClick={dismissFromBackdropClick}
    >
      <Surface
        as="section"
        className="resources-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="resources-dialog-header">
          <div className="resources-dialog-heading">
            <Badge tone="brand">{categoryLabel}</Badge>
            <h2 id={titleId}>{resource.title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="resources-dialog-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="resources-dialog-scroll">
          <p id={descriptionId} className="resources-dialog-summary">{resource.summary}</p>
          <div className="resources-detail-content">
            {resource.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <div className="resources-source-row">
            <span>{sourceLabel}: <em>{resource.sourceLabel}</em></span>
            <a
              className="resources-source-link"
              href={resource.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {learnMoreLabel}
            </a>
          </div>
        </div>
      </Surface>
    </div>,
    document.body
  );
}

export default ResourceDetailDialog;
