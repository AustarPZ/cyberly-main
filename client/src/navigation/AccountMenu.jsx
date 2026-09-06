import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AvatarVisual from "../profile/AvatarVisual";
import { resolveAvatarModel } from "../profile/avatarModel";

export default function AccountMenu({ user, onNavigate, onRequestLogout }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null), triggerRef = useRef(null), itemRefs = useRef([]);
  const initialIndex = useRef(0);
  const displayName = user?.displayName || user?.name || t("nav.accountMenu.userFallback");
  const avatarModel = resolveAvatarModel({ avatarPreset: user?.profile?.avatarPreset, displayName });
  // I01 compatibility: both entries use the existing settings experience.
  const items = [
    { label: t("nav.profile"), page: "profile" },
    { label: t("nav.settings"), page: "profile" },
    ...(user?.role === "admin" ? [{ label: t("nav.accountMenu.adminConsole"), page: "admin" }] : []),
    { label: t("nav.accountMenu.logOut"), logout: true },
  ];
  useEffect(() => { setOpen(false); }, [user?.id]);
  useEffect(() => {
    if (!open) return undefined;
    itemRefs.current[initialIndex.current]?.focus();
    const close = () => { setOpen(false); triggerRef.current?.focus(); };
    const outside = event => { if (!wrapRef.current?.contains(event.target)) close(); };
    const keydown = event => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchstart", outside);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      document.removeEventListener("keydown", keydown);
    };
  }, [open]);
  function move(event, index) {
    const targets = { ArrowDown: (index + 1) % items.length, ArrowUp: (index - 1 + items.length) % items.length, Home: 0, End: items.length - 1 };
    if (targets[event.key] !== undefined) { event.preventDefault(); itemRefs.current[targets[event.key]]?.focus(); }
  }
  return <div className="account-menu-wrap" ref={wrapRef} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button type="button" ref={triggerRef} className={`account-trigger${open ? " open" : ""}`}
      aria-haspopup="menu" aria-expanded={open} aria-controls="account-navigation-menu"
      aria-label={t("nav.accountMenu.triggerAriaLabel", { name: displayName })}
      onClick={() => { initialIndex.current = 0; setOpen(value => !value); }}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault(); initialIndex.current = event.key === "ArrowUp" ? items.length - 1 : 0; setOpen(true);
        }
      }}>
      <span className="nav-avatar" aria-hidden="true">{avatarModel.type === "preset" ? <AvatarVisual presetId={avatarModel.presetId} /> : avatarModel.text}</span>
      <span className="account-chevron" aria-hidden="true">▾</span>
    </button>
    {open && <div className="account-dropdown" id="account-navigation-menu" role="menu" aria-label={t("nav.accountMenu.menuAriaLabel")}>
      <div className="account-menu-header"><div className="account-menu-name">{displayName}</div>
        {user?.email && <div className="account-menu-email">{user.email}</div>}
      </div>
      {items.map((item, index) => <button key={item.label} type="button" role="menuitem" tabIndex={-1}
        className={`account-menu-item${item.logout ? " danger" : ""}`} ref={element => { itemRefs.current[index] = element; }}
        onKeyDown={event => move(event, index)} onClick={() => {
          setOpen(false);
          if (item.logout) onRequestLogout(triggerRef.current); else onNavigate(item.page);
        }}>{item.label}</button>)}
    </div>}
  </div>;
}
