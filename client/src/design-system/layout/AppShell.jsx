export function AppShell({
  navigation,
  footer,
  floating,
  mainClassName = "",
  children,
}) {
  return (
    <div className="cy-app-shell">
      {navigation}
      <main className={["cy-app-shell-main", mainClassName].filter(Boolean).join(" ")}>
        {children}
      </main>
      {footer}
      {floating}
    </div>
  );
}

export default AppShell;
