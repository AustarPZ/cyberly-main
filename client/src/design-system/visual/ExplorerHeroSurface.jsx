import PageIdentity from "./PageIdentity";

export function ExplorerHeroSurface({
  identity,
  icon,
  visual,
  children,
  className = "",
}) {
  const classes = ["cy-explorer-hero", className].filter(Boolean).join(" ");
  const layoutClasses = [
    "cy-explorer-hero-layout",
    !visual && "cy-explorer-hero-layout-content-only",
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className={layoutClasses}>
        <div className="cy-explorer-hero-content">
          {identity && <PageIdentity label={identity} icon={icon} />}
          {children}
        </div>
        {visual && (
          <div className="cy-explorer-hero-visual" aria-hidden="true">
            {visual}
          </div>
        )}
      </div>
    </section>
  );
}

export default ExplorerHeroSurface;
