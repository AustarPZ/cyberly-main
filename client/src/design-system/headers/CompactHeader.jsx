export function CompactHeader({
  eyebrow,
  title,
  description,
  metadata,
  actions,
  headingLevel = 1,
  className = "",
}) {
  const numericHeadingLevel = Number(headingLevel);
  const resolvedHeadingLevel = Number.isInteger(numericHeadingLevel)
    ? Math.min(6, Math.max(1, numericHeadingLevel))
    : 1;
  const Heading = `h${resolvedHeadingLevel}`;

  return (
    <header className={["cy-compact-header", className].filter(Boolean).join(" ")}>
      <div className="cy-compact-header-copy">
        {eyebrow && <div className="cy-compact-header-eyebrow">{eyebrow}</div>}
        <Heading className="cy-compact-header-title">{title}</Heading>
        {description && <p className="cy-compact-header-description">{description}</p>}
        {metadata && <div className="cy-compact-header-metadata">{metadata}</div>}
      </div>
      {actions && <div className="cy-compact-header-actions">{actions}</div>}
    </header>
  );
}

export default CompactHeader;
