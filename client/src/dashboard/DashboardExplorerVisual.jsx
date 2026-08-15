export default function DashboardExplorerVisual() {
  return (
    <div className="dashboard-explorer-visual">
      <svg viewBox="0 0 520 300" role="presentation" aria-hidden="true" focusable="false">
        <path className="dashboard-explorer-cloud" d="M64 76c8-22 40-21 49 0 22-8 39 21 19 34H52c-21-12-9-43 12-34Z" />
        <path className="dashboard-explorer-cloud dashboard-explorer-cloud-far" d="M365 54c7-18 33-18 41 0 19-7 33 18 16 29h-66c-18-10-8-36 9-29Z" />
        <path className="dashboard-explorer-hill dashboard-explorer-hill-far" d="M0 222 116 112l81 70 76-84 123 124Z" />
        <path className="dashboard-explorer-hill" d="M0 258 128 163l75 57 101-92 216 130Z" />
        <path className="dashboard-explorer-path" d="M82 274c75-48 99-28 164-72 51-35 102-55 174-80" />
        <g className="dashboard-explorer-waypoint" transform="translate(407 92)">
          <path d="M24 2 46 11v18c0 18-12 30-22 35C14 59 2 47 2 29V11Z" />
          <path d="m16 31 6 6 12-15" />
        </g>
        <g className="dashboard-explorer-star" transform="translate(430 54)">
          <path d="m12 0 3.4 7.2L23 8.4l-5.5 5.4 1.3 7.7-6.8-3.7-6.8 3.7 1.3-7.7L1 8.4l7.6-1.2Z" />
        </g>
        <g className="dashboard-explorer-nodes">
          <circle cx="130" cy="226" r="7" />
          <circle cx="243" cy="195" r="7" />
          <circle cx="334" cy="151" r="7" />
        </g>
        <g className="dashboard-explorer-companion-zone" transform="translate(42 180)">
          <circle cx="30" cy="30" r="27" />
          <path d="M15 31h30M30 16v30" />
        </g>
      </svg>
    </div>
  );
}
