import Link from 'next/link';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { ResearchDirections } from '@/components/research-directions';
import { NoteList } from '@/components/note-list';
import { AmbientSignal } from '@/components/ambient-signal';
import { ContactTransition, SectionTransition } from '@/components/section-transition';
export const metadata = pageMetadata(
  'Research',
  'Research into decentralized systems, blockchain infrastructure, privacy, AI coordination, and practical Web2–Web3 integration.',
  '/research',
);
export default async function Research() {
  const { research } = await getPublicManifest();
  return (
    <>
      <section className="container page-intro" aria-labelledby="research-title">
        <div className="page-intro-content" data-scroll-reveal>
          <p className="eyebrow">Research</p>
          <AmbientSignal />
          <h1 id="research-title">
            An agenda, shaped
            <br className="desktop-break" /> by questions.
          </h1>
          <p className="lead">
            We explore decentralized systems, the blockchain infrastructure behind them, and the
            questions they raise about privacy and coordination. Our experiments help us understand
            where these technologies can be useful.
          </p>
        </div>
      </section>
      <section
        className="container section agenda-section page-passage"
        aria-labelledby="agenda-title"
      >
        <SectionTransition kind="research-directions" />
        <div className="section-intro" data-scroll-reveal>
          <h2 id="agenda-title">Current directions</h2>
          <p>
            These are directions for exploration. They guide the questions we ask and the
            experiments we choose to pursue.
          </p>
        </div>
        <ResearchDirections />
      </section>
      <section
        className="container research-practice page-passage"
        aria-labelledby="research-practice-title"
      >
        <SectionTransition kind="research-practice" />
        <div className="research-practice-content" data-scroll-reveal>
          <AmbientSignal />
          <h2 id="research-practice-title">From a question to something testable.</h2>
          <p>
            We investigate ideas through prototypes, compare approaches, and document the limits of
            what we learn. A useful result can be a working tool, a clearer trade-off, or a better
            question.
          </p>
          <Link className="text-link" href="/about">
            How the collective works
          </Link>
        </div>
      </section>
      {research.length > 0 && (
        <section className="container section" aria-labelledby="research-notes-title">
          <div data-scroll-reveal>
            <h2 id="research-notes-title">Research notes</h2>
            <NoteList notes={research} />
          </div>
        </section>
      )}
      <ContactTransition kind="research-contact" />
    </>
  );
}
