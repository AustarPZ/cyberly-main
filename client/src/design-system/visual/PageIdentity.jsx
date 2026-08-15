export function PageIdentity({ label, icon, className = "" }) {
  const classes = ["cy-page-identity", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {icon && (
        <span className="cy-page-identity-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="cy-page-identity-label">{label}</span>
    </div>
  );
}

export default PageIdentity;
