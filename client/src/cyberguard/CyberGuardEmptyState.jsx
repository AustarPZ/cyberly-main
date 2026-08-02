import React from "react";

export default function CyberGuardEmptyState({
  title,
  description,
  prompts = null,
}) {
  const titleId = "cyberguard-empty-state-title";
  const descriptionId = "cyberguard-empty-state-description";

  return (
    <section
      className="cyberguard-empty-state"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="cyberguard-empty-state-copy">
        <h2 id={titleId} className="cyberguard-empty-state-title">
          {title}
        </h2>
        <p id={descriptionId} className="cyberguard-empty-state-description">
          {description}
        </p>
      </div>
      {prompts}
    </section>
  );
}
