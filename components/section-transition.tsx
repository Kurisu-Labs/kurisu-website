import '@/styles/section-transition.css';

const passageLabels = {
  'research-work': '01 — 02',
  'work-method': '02 — 03',
  'method-collaboration': '03 — 04',
  'collaboration-contact': '04 — CONTACT',
  'work-repositories': 'WORK — PUBLIC CODE',
  'work-contact': 'WORK — CONTACT',
  'research-directions': 'RESEARCH — DIRECTIONS',
  'research-practice': 'DIRECTIONS — PRACTICE',
  'research-contact': 'RESEARCH — CONTACT',
  'about-collective': 'ABOUT — COLLECTIVE',
  'about-principles': 'COLLECTIVE — PRINCIPLES',
  'about-applied': 'PRINCIPLES — APPLIED',
  'about-contact': 'ABOUT — CONTACT',
};

/** A decorative handoff between sections; document flow and reading order stay unchanged. */
export function SectionTransition({
  kind,
  contained = false,
}: {
  kind: keyof typeof passageLabels;
  contained?: boolean;
}) {
  return (
    <div
      className={`section-transition${contained ? ' container' : ''}`}
      data-section-transition={kind}
      data-ambient-motion
      aria-hidden="true"
    >
      <span className="section-transition-wash" />
      <span className="section-transition-track">
        <span className="section-transition-line" />
      </span>
      <span className="section-transition-stem">
        <span className="section-transition-stem-fill" />
      </span>
      <svg className="section-transition-marker" viewBox="0 0 12 12" focusable="false">
        <path d="M6 1 11 6 6 11 1 6Z" />
        <circle cx="6" cy="6" r="1.5" />
      </svg>
      <span className="section-transition-label">{passageLabels[kind]}</span>
    </div>
  );
}

/** Connect a page to the shared contact section without introducing another content landmark. */
export function ContactTransition({
  kind,
}: {
  kind: 'work-contact' | 'research-contact' | 'about-contact';
}) {
  return (
    <div className="page-contact-transition" aria-hidden="true">
      <SectionTransition kind={kind} contained />
    </div>
  );
}
