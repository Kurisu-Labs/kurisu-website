import '@/styles/ambient-signal.css';

/** A shared decorative signal; content and navigation never depend on its motion. */
export function AmbientSignal({ mobileOnly = false }: { mobileOnly?: boolean }) {
  return (
    <svg
      className={`ambient-signal${mobileOnly ? ' ambient-signal-mobile' : ''}`}
      data-ambient-motion
      viewBox="0 0 144 40"
      width="144"
      height="40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="ambient-signal-track" d="M16 20H128M16 8v24M128 8v24" />
      <circle className="ambient-signal-node" cx="16" cy="20" r="6" />
      <circle className="ambient-signal-node" cx="128" cy="20" r="6" />
      <g className="ambient-signal-ring">
        <path d="m72 6 14 14-14 14-14-14Z" />
        <circle cx="72" cy="6" r="2" />
      </g>
      <g className="ambient-signal-packet">
        <circle cx="16" cy="20" r="7" opacity=".12" />
        <circle cx="16" cy="20" r="2.5" />
      </g>
    </svg>
  );
}
