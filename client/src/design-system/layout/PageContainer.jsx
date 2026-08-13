import React from "react";

const WIDTHS = new Set(["content", "reading", "wide", "full"]);

export function PageContainer({ as: Element = "div", width = "content", className = "", children, ...props }) {
  const resolvedWidth = WIDTHS.has(width) ? width : "content";
  return (
    <Element {...props} className={["cy-page-container", `cy-page-container-${resolvedWidth}`, className].filter(Boolean).join(" ")}>
      {children}
    </Element>
  );
}

export default PageContainer;
