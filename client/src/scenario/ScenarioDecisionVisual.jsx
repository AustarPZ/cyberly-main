export default function ScenarioDecisionVisual() {
  return (
    <svg
      className="scenario-decision-visual"
      viewBox="0 0 420 260"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <g className="scenario-decision-environment">
        <path d="M26 220 92 154l52 66M262 220l66-80 70 80" />
        <path d="M20 220h380" />
      </g>
      <g className="scenario-decision-route">
        <path d="M44 220c64-4 92-36 120-68 18-21 34-35 52-43" />
        <path d="M216 109c38-28 68-48 116-50" />
        <path d="M216 109c40 4 77 26 114 70" />
        <circle cx="44" cy="220" r="9" />
        <circle cx="216" cy="109" r="11" />
        <circle cx="332" cy="59" r="9" />
        <circle cx="330" cy="179" r="9" />
      </g>
      <g className="scenario-decision-signposts">
        <path d="M208 108v-55M208 61h-58l-14-12 14-12h58M208 78h62l14 12-14 12h-62" />
      </g>
      <g className="scenario-decision-device">
        <rect x="68" y="91" width="76" height="54" rx="8" />
        <path d="M81 107h48M81 119h35M98 153h16" />
      </g>
      <g className="scenario-decision-shield">
        <path d="M312 133 342 122l30 11v22c0 24-13 42-30 51-17-9-30-27-30-51Z" />
        <path d="m329 158 9 9 18-21" />
      </g>
      <g className="scenario-decision-digital">
        <circle cx="170" cy="54" r="5" />
        <path d="M91 52h28M105 38v28M359 81h24M371 69v24" />
      </g>
    </svg>
  );
}
