import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AccountMenu from "./AccountMenu";
import "./shell.css";

export default function GlobalNavigation({ page, user, items, onNavigate, openAuth, onRequestLogout, languageControl, logo, onHelp }) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 1050px)").matches);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null), wrapRef = useRef(null), itemRefs = useRef([]);
  const navItems = items || (user ? ["dashboard", "resources", "scenarios", "assessment", "ai-chat", "about"] : ["home", "resources", "about"])
    .map(id => ({ id, labelKey: id === "ai-chat" ? "nav.cyberGuard" : `nav.${id}` }));
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1050px)");
    const update = () => { setMobile(query.matches); setOpen(false); };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => { setOpen(false); }, [page, user?.id]);
  useEffect(() => {
    if (!open) return undefined;
    itemRefs.current[0]?.focus();
    const close = event => {
      if (event.type === "keydown" ? event.key === "Escape" : !wrapRef.current?.contains(event.target)) {
        setOpen(false); triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const select = action => { setOpen(false); action(); };
  return <nav className={`navbar cy-global-navigation${page === "ai-chat" ? " cyberguard-nav-flow" : ""}`}>
    <button type="button" className="nav-logo" onClick={() => onNavigate(user ? "dashboard" : "home")} aria-label={t(user ? "nav.brandDashboardAriaLabel" : "nav.brandHomeAriaLabel")}>
      <img className="navbar-logo" src={logo} alt="Cyberly" />
    </button>
    {mobile && <div className="mobile-menu-wrap" ref={wrapRef}>
      <button type="button" className="mobile-menu-button" ref={triggerRef} aria-haspopup="menu" aria-expanded={open}
        aria-controls="mobile-navigation-menu" aria-label={t(open ? "nav.closeMenuAriaLabel" : "nav.openMenuAriaLabel")}
        onClick={() => setOpen(value => !value)}><span aria-hidden="true">{open ? "×" : "☰"}</span></button>
      {open && <div className="mobile-menu-panel" id="mobile-navigation-menu" role="menu" aria-label={t("nav.mobileNavigationLabel")}
        onKeyDown={event => {
          const list = Array.from(event.currentTarget.querySelectorAll('[role="menuitem"]'));
          const index = list.indexOf(document.activeElement);
          const next = { ArrowDown: (index + 1) % list.length, ArrowUp: (index - 1 + list.length) % list.length, Home: 0, End: list.length - 1 }[event.key];
          if (next !== undefined) { event.preventDefault(); list[next]?.focus(); }
        }}>
        {navItems.map((item, index) => <button key={item.id} type="button" role="menuitem" className={`mobile-nav-item${page === item.id ? " active" : ""}`}
          ref={el => { itemRefs.current[index] = el; }} aria-current={page === item.id ? "page" : undefined}
          onClick={() => select(() => onNavigate(item.id))}>{t(item.labelKey)}</button>)}
        {!user && <div className="mobile-menu-actions">
          {typeof onHelp === "function" && <button type="button" role="menuitem" className="mobile-nav-item" onClick={() => select(onHelp)}>{t("nav.help")}</button>}
          <button type="button" role="menuitem" className="mobile-nav-item" onClick={() => select(() => openAuth("login"))}>{t("nav.signIn")}</button>
        </div>}
      </div>}
    </div>}
    <div className="nav-primary" aria-label={t("nav.primaryAriaLabel")}>
      {navItems.map(item => <button key={item.id} type="button" className={`nav-link${page === item.id ? " active" : ""}`}
        aria-current={page === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>{t(item.labelKey)}</button>)}
    </div>
    <div className="nav-utility">{languageControl}
      {user ? <AccountMenu user={user} onNavigate={onNavigate} onRequestLogout={onRequestLogout} /> : <div className="desktop-auth-actions">
        {typeof onHelp === "function" && <button type="button" className="nav-link" onClick={onHelp}>{t("nav.help")}</button>}
        <button type="button" className="nav-cta" onClick={() => openAuth("login")}>{t("nav.signIn")}</button>
      </div>}
    </div>
  </nav>;
}
