import Link from 'next/link';
import { pageMetadata } from '@/lib/site';
import { BrandMark } from '@/components/brand-mark';
import { Arrow } from '@/components/icons';
export const metadata = pageMetadata(
  'About',
  'An independent research and engineering collective exploring decentralized systems and blockchain, open to research collaborations and software projects.',
  '/about',
);
export default function About() {
  return (
    <>
      <section className="container page-intro about-intro">
        <p className="eyebrow">About the collective</p>
        <h1>
          An independent place
          <br className="desktop-break" /> to explore and build.
        </h1>
        <p className="lead">
          Kurisu Labs is an independent research and engineering collective focused on decentralized
          systems and blockchain.
        </p>
      </section>
      <section className="container about-statement">
        <div className="about-mark">
          <BrandMark />
        </div>
        <div>
          <h2>
            Different interests.
            <br />
            Shared curiosity.
          </h2>
          <p>
            We bring together developers with different technical interests to investigate ideas,
            build experiments, and turn useful results into working systems.
          </p>
          <p>
            Decentralized systems, blockchain, and Web3 are our current focus. Our interests also
            span developer tools, privacy, AI, and the infrastructure connecting these fields. Each
            project can take its own direction while contributing to a shared body of knowledge and
            experience.
          </p>
        </div>
      </section>
      <section className="container section about-principles" aria-labelledby="collective-title">
        <div>
          <p className="eyebrow">The collective model</p>
          <h2 id="collective-title">
            Small teams.
            <br />
            Room to explore.
          </h2>
        </div>
        <div className="principles-list">
          <article>
            <h3>Project-led, by choice</h3>
            <p>
              Small, opt-in teams form around a question, a shared interest, and the capacity to
              work on it. Responsibility sits with the people doing the work.
            </p>
          </article>
          <article>
            <h3>Across technologies and ecosystems</h3>
            <p>
              We are not organized around a single product or blockchain. The problem shapes the
              tools and architecture we explore.
            </p>
          </article>
          <article>
            <h3>Useful results, honest limits</h3>
            <p>
              Our aim is to make useful things, document what we learn, and keep asking better
              questions. An experiment can end with a finding instead of a product.
            </p>
          </article>
        </div>
      </section>
      <section className="applied-panel">
        <div className="container collaboration-section">
          <div>
            <p className="eyebrow">One direction of exploration</p>
            <h2>
              Existing systems.
              <br />
              New possibilities.
            </h2>
          </div>
          <div>
            <p className="lead">
              We help teams explore the shift from conventional systems toward decentralized
              infrastructure.
            </p>
            <p>
              Through research, prototypes, and engineering collaboration, we explore practical
              steps from Web2 to Web3. This can mean adding blockchain capabilities to an existing
              product, designing a hybrid architecture, or developing a new solution together.
            </p>
            <Link className="text-link" href="/research#applied-decentralization">
              Explore this research direction
              <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
