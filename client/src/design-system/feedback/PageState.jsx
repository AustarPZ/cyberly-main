import React from "react";

export function PageState({ type = "loading", title, message, actionLabel, onAction }) {
  const isError = type === "error";
  return (
    <div className={`page-state ${type}`} role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>
      {title && <div className="page-state-title">{title}</div>}
      {message && <div>{message}</div>}
      {actionLabel && onAction && (
        <button type="button" className="btn-ghost page-state-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

export default PageState;
