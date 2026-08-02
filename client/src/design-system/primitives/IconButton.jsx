import React from "react";

const ICON_BUTTON_VARIANTS = new Set(["quiet", "primary"]);

export function IconButton({
  label,
  variant = "quiet",
  disabled = false,
  onClick,
  className = "",
  children,
  type = "button",
  color: _color,
  tone: _tone,
  style: _style,
  ...buttonProps
}) {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) {
    throw new Error("IconButton requires a non-empty label.");
  }

  const resolvedVariant = ICON_BUTTON_VARIANTS.has(variant) ? variant : "quiet";

  return (
    <button
      {...buttonProps}
      type={type}
      className={[
        "cy-icon-button",
        `cy-icon-button-${resolvedVariant}`,
        className,
      ].filter(Boolean).join(" ")}
      aria-label={cleanLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  );
}

export default IconButton;

