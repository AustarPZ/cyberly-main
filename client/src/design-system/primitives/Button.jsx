import React from "react";

const BUTTON_VARIANTS = new Set(["primary", "secondary", "quiet", "danger"]);

export function Button({
  variant = "secondary",
  loading = false,
  loadingLabel = "Loading",
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
  const resolvedVariant = BUTTON_VARIANTS.has(variant) ? variant : "secondary";
  const disabledOrLoading = Boolean(disabled || loading);

  function handleClick(event) {
    if (disabledOrLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...buttonProps}
      type={type}
      className={[
        "cy-button",
        `cy-button-${resolvedVariant}`,
        loading ? "is-loading" : "",
        className,
      ].filter(Boolean).join(" ")}
      disabled={disabledOrLoading}
      aria-busy={loading ? "true" : undefined}
      onClick={handleClick}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export default Button;

