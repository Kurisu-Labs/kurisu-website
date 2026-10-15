import '@/styles/repository-diagram.css';

function EscrowSketch() {
  return (
    <>
      <path className="repository-diagram-guide" d="M52 70V42H268V70M52 118V150H268V118" />
      <path className="repository-diagram-line" d="M76 94H244" />
      <path className="repository-diagram-trace" d="M76 94H124M196 94H244" />
      <circle className="repository-diagram-panel" cx="52" cy="94" r="24" />
      <circle className="repository-diagram-panel" cx="268" cy="94" r="24" />
      <circle className="repository-diagram-line" cx="52" cy="94" r="13" />
      <circle className="repository-diagram-line" cx="268" cy="94" r="13" />
      <path className="repository-diagram-trace" d="M46 94H58M52 88V100M262 94H274M268 88V100" />
      <path className="repository-diagram-guide" d="M112 54V134M208 54V134" />
      <g className="repository-diagram-vault">
        <rect className="repository-diagram-panel" x="124" y="56" width="72" height="76" rx="3" />
        <path className="repository-diagram-line" d="M132 64H188V124H132Z" />
        <path className="repository-diagram-trace" d="M148 88V81a12 12 0 0 1 24 0v7" />
        <rect
          className="repository-diagram-emphasis"
          x="143"
          y="88"
          width="34"
          height="25"
          rx="2"
        />
        <path className="repository-diagram-line" d="M160 97V104" />
      </g>
      <g className="repository-diagram-mechanism">
        <circle className="repository-diagram-signal-halo" cx="78" cy="94" r="9" />
        <circle className="repository-diagram-signal" cx="78" cy="94" r="4" />
      </g>
      <path className="repository-diagram-tick" d="M154 42H166M154 150H166" />
    </>
  );
}

function RelaySketch() {
  return (
    <>
      <path
        className="repository-diagram-line"
        d="M48 122V24H272V38M48 150V164H272V66M76 24V80H132V52H188M216 24V38M76 108H48M132 80V94H146M188 108V94H244M76 150V164M118 136H160V164M188 136H244V108H272M216 108V136M244 80H272"
      />
      <path className="repository-diagram-guide" d="M20 136H48M272 52H300" />
      <path
        className="repository-diagram-trace repository-diagram-route"
        d="M48 136H104V108H160V80H216V52H272"
      />
      <path className="repository-diagram-emphasis" d="M198 98H230V130H198Z" />
      <path className="repository-diagram-line" d="M207 106V121H222" />
      <circle className="repository-diagram-panel" cx="48" cy="136" r="7" />
      <circle className="repository-diagram-panel" cx="272" cy="52" r="7" />
      <g className="repository-diagram-mechanism">
        <circle className="repository-diagram-signal-halo" cx="48" cy="136" r="10" />
        <circle className="repository-diagram-signal" cx="48" cy="136" r="4" />
      </g>
      <path className="repository-diagram-tick" d="M20 130V142M300 46V58" />
    </>
  );
}

function EvidenceSketch() {
  return (
    <>
      <path className="repository-diagram-guide" d="M76 68V116M160 106V154M244 68V116" />
      <path className="repository-diagram-panel" d="M76 116L160 78L244 116L160 154Z" />
      <path className="repository-diagram-line" d="M99 116L160 144L221 116" />
      <path className="repository-diagram-panel" d="M76 92L160 54L244 92L160 130Z" />
      <path className="repository-diagram-line" d="M99 92L160 120L221 92" />
      <g className="repository-diagram-mechanism">
        <path className="repository-diagram-emphasis" d="M76 68L160 30L244 68L160 106Z" />
        <path
          className="repository-diagram-line"
          d="M111 66L156 46L178 56L133 76ZM143 81L190 60M154 86L201 65"
        />
        <circle className="repository-diagram-signal" cx="160" cy="68" r="3" />
      </g>
      <path className="repository-diagram-trace" d="M52 68V140H132M188 140H268V68" />
      <path className="repository-diagram-tick" d="M46 68H58M262 68H274M132 134V146M188 134V146" />
      <circle className="repository-diagram-panel" cx="160" cy="160" r="8" />
      <path className="repository-diagram-trace" d="M157 160H163M160 157V163" />
    </>
  );
}

const sketches = [
  { slug: 'rentra', subject: 'Peer escrow', Graphic: EscrowSketch },
  { slug: 'ruin-relay', subject: 'Relay route', Graphic: RelaySketch },
  { slug: 'zecsolve', subject: 'Evidence review', Graphic: EvidenceSketch },
] as const;

/** Abstract illustrations of the catalog descriptions, never product screens or live data. */
export function RepositoryDiagram({ slug }: { slug: string }) {
  const sketch = sketches.find((candidate) => candidate.slug === slug);
  if (!sketch) return null;
  const Graphic = sketch.Graphic;

  return (
    <figure
      className="repository-diagram"
      data-repository-diagram={sketch.slug}
      data-ambient-motion
    >
      <svg
        className="repository-diagram-svg"
        viewBox="0 0 320 190"
        width="320"
        height="190"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="repository-diagram-grid"
          d="M40 16V174M80 16V174M120 16V174M160 16V174M200 16V174M240 16V174M280 16V174M16 35H304M16 75H304M16 115H304M16 155H304"
        />
        <path
          className="repository-diagram-registration"
          d="M16 26V16H26M294 16H304V26M16 164V174H26M294 174H304V164"
        />
        <Graphic />
      </svg>
      <figcaption>
        <span>Concept sketch</span>
        <span>{sketch.subject}</span>
      </figcaption>
    </figure>
  );
}
