export function AssessmentCheckpointVisual() {
  return (
    <div className="assessment-checkpoint-visual">
      <svg viewBox="0 0 520 300" role="presentation" aria-hidden="true" focusable="false">
        <g className="assessment-checkpoint-environment">
          <path d="M18 255 126 172l66 56 96-116 67 79 58-49 89 113Z" />
          <path d="M18 270h484" />
        </g>
        <path className="assessment-checkpoint-route" d="M74 251c51-34 91-41 135-70 42-28 80-45 131-57" />
        <g className="assessment-checkpoint-nodes">
          <circle cx="91" cy="240" r="8" />
          <circle cx="198" cy="188" r="8" />
          <circle cx="305" cy="139" r="8" />
        </g>
        <g className="assessment-checkpoint-compass" transform="translate(388 84)">
          <circle r="47" />
          <circle r="34" />
          <path d="m-10 14 9-29 12 18Z" />
          <path d="m10-14-9 29-12-18Z" />
        </g>
        <g className="assessment-checkpoint-marker" transform="translate(307 139)">
          <path d="M0 0v-75h58" />
          <path d="m58-75-17 16 17 16Z" />
          <circle cy="3" r="13" />
        </g>
        <g className="assessment-checkpoint-shield" transform="translate(391 84)">
          <path d="M0-25 22-17v19c0 17-10 29-22 36C-12 31-22 19-22 2v-19Z" />
          <path className="assessment-checkpoint-shield-mark" d="m-9 3 7 7L11-6" />
        </g>
        <g className="assessment-checkpoint-digital">
          <path d="M77 93h20v20H77zM443 192h17v17h-17z" />
          <circle cx="143" cy="91" r="7" />
        </g>
      </svg>
    </div>
  );
}

export default AssessmentCheckpointVisual;
