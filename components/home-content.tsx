import Link from 'next/link';
import type { PublicManifest } from '@/lib/content/schema';
import { homeCopy } from '@/lib/site';
import { BrandMark } from './brand-mark';
import { Arrow } from './icons';
import { ResearchDirections } from './research-directions';
import { WorkList } from './work-list';
import { NoteList } from './note-list';

export function HomeContent({ manifest }: { manifest: PublicManifest }) {
  const cta = manifest.projects.length
    ? homeCopy.hero.primaryCtaWithWork
    : homeCopy.hero.primaryCtaWithoutWork;
  const featured = manifest.projects.filter((project) => project.featured);
  const selected = (featured.length ? featured : manifest.projects).slice(0, 3);
  return (
    <>
      <section className="hero container" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">{homeCopy.hero.eyebrow}</p>
          <h1 id="home-title">{homeCopy.hero.title}</h1>
          <p className="hero-description">{homeCopy.hero.body}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={cta.href}>
              {cta.label}
              <Arrow />
            </a>
            <Link className="text-link" href="/about">
              {homeCopy.hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="hero-composition" aria-hidden="true">
          <div className="mark-frame">
            <span className="frame-line frame-line-top" />
            <BrandMark />
            <span className="frame-line frame-line-bottom" />
          </div>
          <span className="composition-caption">Ideas into form.</span>
        </div>
      </section>
      {selected.length > 0 && (
        <section className="container section" aria-labelledby="work-title">
          <div className="section-heading">
            <h2 id="work-title">
              {selected.every((project) => project.attribution === 'member-prior-work')
                ? 'Previous work by our members'
                : 'Selected work'}
            </h2>
            <Link className="text-link" href="/work">
              All work <Arrow />
            </Link>
          </div>
          <WorkList projects={selected} />
        </section>
      )}
      <section className="container section research-section" aria-labelledby="directions-title">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Research directions</p>
            <h2 id="directions-title">{homeCopy.directions.title}</h2>
          </div>
          <p>{homeCopy.directions.intro}</p>
        </div>
        <ResearchDirections />
        <Link className="text-link section-more" href="/research">
          Our research agenda <Arrow />
        </Link>
      </section>
      <section className="approach-section" aria-labelledby="approach-title">
        <div className="container">
          <div className="section-intro">
            <div>
              <p className="eyebrow">How we work</p>
              <h2 id="approach-title">{homeCopy.approach.title}</h2>
            </div>
            <p>{homeCopy.approach.body}</p>
          </div>
          <ol className="process-list">
            {[
              ['Investigate', 'Start with a question. Understand the context and the constraints.'],
              ['Prototype', 'Make an idea tangible. Build enough to test the assumptions.'],
              ['Evaluate', 'Examine what works, what fails, and what remains uncertain.'],
              [
                'Develop & share',
                'Take useful results further. Document the learning along the way.',
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span className="process-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        className="container section collaboration-section"
        aria-labelledby="collaboration-title"
      >
        <div>
          <p className="eyebrow">Applied collaboration</p>
          <h2 id="collaboration-title">{homeCopy.collaboration.title}</h2>
        </div>
        <div>
          <p className="lead">{homeCopy.collaboration.body}</p>
          <p>{homeCopy.collaboration.supportingLine}</p>
          <a className="text-link" href={homeCopy.collaboration.cta.href}>
            {homeCopy.collaboration.cta.label}
            <Arrow external />
          </a>
        </div>
      </section>
      {manifest.research.length > 0 && (
        <section className="container section" aria-labelledby="notes-title">
          <div className="section-heading">
            <h2 id="notes-title">Notes from the lab</h2>
            <Link className="text-link" href="/research">
              All research <Arrow />
            </Link>
          </div>
          <NoteList notes={manifest.research.slice(0, 3)} />
        </section>
      )}
    </>
  );
}
