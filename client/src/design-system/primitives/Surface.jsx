import React from "react";

const VARIANTS = new Set(["standard", "subdued", "outlined"]);

export function Surface({ as: Element = "div", variant = "standard", className = "", children, ...props }) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "standard";
  return <Element {...props} className={["cy-surface", `cy-surface-${resolvedVariant}`, className].filter(Boolean).join(" ")}>{children}</Element>;
}

export default Surface;
