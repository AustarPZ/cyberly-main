export default function ProgressExplorerVisual() {
  return (
    <div className="progress-explorer-visual">
      <svg viewBox="0 0 520 300" role="presentation" aria-hidden="true" focusable="false">
        <g className="progress-explorer-clouds">
          <path d="M58 76c8-21 39-20 47 0 21-8 37 20 18 32H48C29 96 38 67 58 76Z" />
          <path d="M354 60c7-18 33-17 40 0 18-7 32 17 16 28h-65c-17-10-8-35 9-28Z" />
        </g>
        <g className="progress-explorer-mountains">
          <path className="progress-explorer-mountain-far" d="M0 238 92 158l57 48 79-91 75 72 58-64 159 115Z" />
          <path className="progress-explorer-mountain-near" d="M0 278 117 195l58 42 101-100 70 63 63-46 111 124Z" />
        </g>
        <path className="progress-explorer-path" d="M65 278c69-35 111-31 145-69 31-35 59-29 88-62 28-32 56-39 112-54" />
        <g className="progress-explorer-milestones">
          <circle className="progress-explorer-milestone" cx="148" cy="239" r="7" />
          <circle className="progress-explorer-milestone" cx="252" cy="179" r="7" />
          <circle className="progress-explorer-milestone" cx="339" cy="125" r="7" />
        </g>
        <g className="progress-explorer-destination" transform="translate(397 48)">
          <path className="progress-explorer-star" d="m24 0 5.5 11.4L42 13.2l-9 8.8 2.1 12.4L24 28.5l-11.1 5.9L15 22l-9-8.8 12.5-1.8Z" />
          <path className="progress-explorer-shield" d="M24 42 43 50v15c0 16-10 27-19 31C15 92 5 81 5 65V50Z" />
          <path className="progress-explorer-shield-mark" d="m17 67 5 5 10-12" />
        </g>
        <g className="progress-explorer-digital-accents">
          <path d="M103 120h18v18h-18Z" />
          <path d="M304 70h13v13h-13Z" />
          <circle cx="451" cy="139" r="6" />
        </g>
        <g className="progress-explorer-companion-zone" transform="translate(34 188)">
          <circle cx="30" cy="30" r="27" />
          <path d="M17 30h26M30 17v26" />
        </g>
      </svg>
    </div>
  );
}
