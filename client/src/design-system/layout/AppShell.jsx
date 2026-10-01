export function AppShell({
  navigation,
  footer,
  floating,
  mainClassName = "",
  children,
}) {
  return (
    <div className={["cy-app-shell", floating && "cy-app-shell-with-floating"].filter(Boolean).join(" ")}>
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
