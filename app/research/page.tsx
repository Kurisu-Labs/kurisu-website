import Link from 'next/link';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { ResearchDirections } from '@/components/research-directions';
import { NoteList } from '@/components/note-list';
export const metadata = pageMetadata(
  'Research',
  'Research into decentralized systems, blockchain infrastructure, privacy, AI coordination, and practical Web2–Web3 integration.',
  '/research',
);
export default async function Research() {
  const { research } = await getPublicManifest();
  return (
    <>
      <section className="container page-intro">
        <p className="eyebrow">Research</p>
        <h1>
          An agenda, shaped
          <br className="desktop-break" /> by questions.
        </h1>
        <p className="lead">
          We explore decentralized systems, the blockchain infrastructure behind them, and the
          questions they raise about privacy and coordination. Our experiments help us understand
          where these technologies can be useful.
        </p>
      </section>
      <section className="container section agenda-section" aria-labelledby="agenda-title">
        <div className="section-intro">
          <h2 id="agenda-title">Current directions</h2>
          <p>
            These are directions for exploration. They guide the questions we ask and the
            experiments we choose to pursue.
          </p>
        </div>
        <ResearchDirections />
      </section>
      <section className="container research-practice">
        <span className="small-rule" aria-hidden="true" />
        <h2>From a question to something testable.</h2>
        <p>
          We investigate ideas through prototypes, compare approaches, and document the limits of
          what we learn. A useful result can be a working tool, a clearer trade-off, or a better
          question.
        </p>
        <Link className="text-link" href="/about">
          How the collective works
        </Link>
      </section>
      {research.length > 0 && (
        <section className="container section">
          <h2>Research notes</h2>
          <NoteList notes={research} />
        </section>
      )}
    </>
  );
}
