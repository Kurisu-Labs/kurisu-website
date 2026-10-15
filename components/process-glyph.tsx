import '@/styles/process-glyph.css';

/** A decorative visual shorthand for the four published research stages. */
export function ProcessGlyph({ stage }: { stage: number }) {
  return (
    <svg
      className="process-glyph"
      data-ambient-motion
      viewBox="0 0 104 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="process-glyph-guide" d="M4 14V4h10M90 4h10v10M4 58v10h10M90 68h10V58" />
      {stage === 0 && (
        <>
          <circle className="process-glyph-guide" cx="52" cy="36" r="25" />
          <path className="process-glyph-guide" d="M21 36h62M52 5v62" />
          <g className="process-glyph-search">
            <circle cx="48" cy="31" r="13" />
            <path d="m57 40 15 15" />
            <circle className="process-glyph-dot" cx="48" cy="31" r="3" />
          </g>
        </>
      )}
      {stage === 1 && (
        <>
          <path className="process-glyph-guide" d="M24 58h56M24 14h56" />
          <rect
            className="process-glyph-block process-glyph-block-a"
            x="27"
            y="37"
            width="20"
            height="20"
          />
          <rect
            className="process-glyph-block process-glyph-block-b"
            x="52"
            y="37"
            width="20"
            height="20"
          />
          <rect
            className="process-glyph-block process-glyph-block-c"
            x="52"
            y="12"
            width="20"
            height="20"
          />
        </>
      )}
      {stage === 2 && (
        <>
          <path className="process-glyph-guide" d="M23 13v46h60M23 35h60" />
          <path className="process-glyph-bar process-glyph-bar-a" d="M36 58V39" />
          <path className="process-glyph-bar process-glyph-bar-b" d="M52 58V20" />
          <path className="process-glyph-bar process-glyph-bar-c" d="M68 58V29" />
          <path d="M29 14h12m-6-6v12" />
        </>
      )}
      {stage === 3 && (
        <>
          <path className="process-glyph-guide" d="m52 36-27-17m27 17 27-17M52 36v24" />
          <circle className="process-glyph-origin" cx="52" cy="36" r="10" />
          <g className="process-glyph-share">
            <path d="m37 27-12-8m0 0 1 8m-1-8 8-2m34 10 12-8m0 0-1 8m1-8-8-2M52 50v10m0 0-5-5m5 5 5-5" />
            <circle className="process-glyph-dot" cx="52" cy="36" r="3" />
          </g>
        </>
      )}
    </svg>
  );
}
