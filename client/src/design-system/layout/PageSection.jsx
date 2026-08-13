import React from "react";

export function PageSection({ as: Element = "section", className = "", children, ...props }) {
  return <Element {...props} className={["cy-page-section", className].filter(Boolean).join(" ")}>{children}</Element>;
}

export default PageSection;
