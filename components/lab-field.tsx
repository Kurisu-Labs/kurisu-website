/** Decorative research map. The interactive network follows below the hero. */
export function LabField() {
  return (
    <div className="lab-field" data-motion-surface="field">
      <div className="field-heading" aria-hidden="true">
        <span>FIG. 01 / RESEARCH FIELD</span>
        <span>↗</span>
      </div>
      <svg
        viewBox="0 0 520 480"
        fill="none"
        className="field-diagram"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern id="field-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" stroke="currentColor" strokeOpacity=".12" />
          </pattern>
        </defs>
        <path fill="url(#field-grid)" d="M0 0h520v480H0z" />
        <g className="field-orbits" stroke="currentColor">
          <circle cx="260" cy="240" r="166" strokeOpacity=".17" />
          <g className="field-idle-orbits">
            <circle cx="260" cy="240" r="124" strokeOpacity=".22" strokeDasharray="2 9" />
            <ellipse
              cx="260"
              cy="240"
              rx="210"
              ry="80"
              transform="rotate(-38 260 240)"
              strokeOpacity=".45"
            />
          </g>
          <g className="field-idle-signal">
            <circle cx="260" cy="74" r="3" fill="currentColor" stroke="none" />
          </g>
          <g className="field-idle-signal field-idle-signal-secondary">
            <circle cx="136" cy="240" r="2.5" fill="currentColor" stroke="none" />
          </g>
          <ellipse
            cx="260"
            cy="240"
            rx="210"
            ry="80"
            transform="rotate(38 260 240)"
            strokeOpacity=".45"
          />
          <path
            d="M82 128L424 148 380 371 115 350 82 128 380 371M115 350L424 148"
            strokeOpacity=".22"
          />
        </g>
        <g className="field-idle-core">
          <circle className="field-brand-core" cx="260" cy="240" r="37" />
        </g>
        <g className="field-node">
          <circle cx="82" cy="128" r="5" />
          <circle cx="424" cy="148" r="5" />
          <circle cx="380" cy="371" r="5" />
          <circle cx="115" cy="350" r="5" />
          <circle cx="260" cy="240" r="7" fill="var(--color-on-dark)" />
        </g>
        <circle cx="260" cy="240" r="37" stroke="currentColor" strokeOpacity=".5" />
        <path d="M260 189v-8m0 118v-8m51-51h8m-118 0h8" stroke="currentColor" />
        <g className="field-label" fill="currentColor">
          <text x="24" y="105">
            01 / INFRASTRUCTURE
          </text>
          <text x="362" y="122">
            02 / PRIVACY
          </text>
          <text x="333" y="403">
            03 / COORDINATION
          </text>
          <text x="22" y="381">
            04 / INTEGRATION
          </text>
        </g>
      </svg>
      <div className="field-caption">
        <span aria-hidden="true">
          Different questions.
          <br />
          Connected possibilities.
        </span>
      </div>
    </div>
  );
}
