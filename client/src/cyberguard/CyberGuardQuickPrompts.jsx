import React from "react";
import Button from "../design-system/primitives/Button";

export default function CyberGuardQuickPrompts({
  prompts = [],
  label = "Quick-start prompts",
  disabled = false,
  onSelectPrompt,
}) {
  const visiblePrompts = prompts.slice(0, 4);

  return (
    <div className="cyberguard-quick-prompts" role="group" aria-label={label}>
      {visiblePrompts.map(prompt => (
        <Button
          key={prompt.id}
          type="button"
          variant="secondary"
          className="cyberguard-quick-prompt"
          data-prompt-id={prompt.id}
          disabled={disabled}
          onClick={() => onSelectPrompt?.(prompt)}
        >
          {prompt.label}
        </Button>
      ))}
    </div>
  );
}
