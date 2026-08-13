import React from "react";

export function ContextHeader({
  title,
  headingLevel = 1,
  headingRef,
  headingTabIndex,
  eyebrow,
  description,
  metadata,
  actions,
  className = "",
}) {
  const Heading = `h${Math.min(6, Math.max(1, Number(headingLevel) || 1))}`;
  return (
    <header className={["cy-context-header", className].filter(Boolean).join(" ")}>
      <div className="cy-context-header-copy">
        {eyebrow && <div className="cy-context-header-eyebrow">{eyebrow}</div>}
        <Heading ref={headingRef} tabIndex={headingTabIndex} className="cy-context-header-title">{title}</Heading>
        {description && <p className="cy-context-header-description">{description}</p>}
        {metadata && <div className="cy-context-header-metadata">{metadata}</div>}
      </div>
      {actions && <div className="cy-context-header-actions">{actions}</div>}
    </header>
  );
}

export default ContextHeader;
