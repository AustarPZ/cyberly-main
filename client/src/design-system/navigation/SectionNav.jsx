export default function SectionNav({
  ariaLabel,
  title,
  items = [],
  activeId,
  onSelect,
  className = "",
}) {
  const classes = ["cy-section-nav", className].filter(Boolean).join(" ");

  return (
    <aside className={classes} aria-label={ariaLabel}>
      <div className="cy-section-nav-title">{title}</div>
      <div className="cy-section-nav-list">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              className={`cy-section-nav-button${isActive ? " active" : ""}`}
              aria-current={isActive ? "location" : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
