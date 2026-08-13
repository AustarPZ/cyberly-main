import React from "react";

const TONES = new Set(["neutral", "brand", "success", "warning", "danger"]);

export function Badge({ as: Element = "span", tone = "neutral", className = "", children, ...props }) {
  const resolvedTone = TONES.has(tone) ? tone : "neutral";
  return <Element {...props} className={["cy-badge", `cy-badge-${resolvedTone}`, className].filter(Boolean).join(" ")}>{children}</Element>;
}

export default Badge;
