import Link from 'next/link';
import type { PublicManifest } from '@/lib/content/schema';
import { homeCopy } from '@/lib/site';
import { publicRepositories } from '@/lib/public-repositories';
import { Arrow } from './icons';
import { LabField } from './lab-field';
import { ResearchNetwork } from './research-network';
import { PublicRepositoryList } from './public-repository-list';
import { ProcessGlyph } from './process-glyph';
import { AmbientSignal } from './ambient-signal';
import { SectionTransition } from './section-transition';
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
          <AmbientSignal mobileOnly />
          <h1 id="home-title">{homeCopy.hero.title}</h1>
          <p className="hero-description">{homeCopy.hero.body}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={cta.href}>
              {cta.label}
              <Arrow />
            </Link>
            <Link className="text-link" href="/about">
              {homeCopy.hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <LabField />
        <div className="hero-index">
          <span className="meta">INDEPENDENT MINDS. SHARED CURIOSITY.</span>
          <a href="#research-network">
            Explore the lab <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section
        id="research-network"
        className="container section research-section"
        aria-labelledby="directions-title"
      >
        <div className="section-intro" data-scroll-reveal>
          <div>
            <p className="eyebrow">
              <span className="section-number">01 /</span> Research directions
            </p>
            <h2 id="directions-title">{homeCopy.directions.title}</h2>
          </div>
          <p>{homeCopy.directions.intro}</p>
        </div>
        <ResearchNetwork id="living-research" />
        <Link className="text-link section-more" href="/research">
          Our research agenda <Arrow />
        </Link>
      </section>
      {(publicRepositories.length > 0 || selected.length > 0) && (
        <section
          id="public-work"
          className="container section public-work-section"
          aria-labelledby="public-work-title"
        >
          <SectionTransition kind="research-work" />
          <div className="section-intro" data-scroll-reveal>
            <div>
              <p className="eyebrow">
                <span className="section-number">02 /</span> Public work
              </p>
              <h2 id="public-work-title">
                Out of the lab.
                <br />
                Into the open.
              </h2>
            </div>
            <p>
              Explore the products, tools, and experiments in our public GitHub repositories. Follow
              the code to see what each project does.
            </p>
          </div>
          {publicRepositories.length > 0 && (
            <PublicRepositoryList repositories={publicRepositories} />
          )}
          {selected.length > 0 && (
            <div className="approved-work">
              <h3>
                {selected.every((project) => project.attribution === 'member-prior-work')
                  ? 'Previous work by our members'
                  : 'Selected work'}
              </h3>
              <WorkList projects={selected} />
            </div>
          )}
          <Link className="text-link section-more" href="/work">
            Explore all work <Arrow />
          </Link>
        </section>
      )}
      <section id="method" className="approach-section" aria-labelledby="approach-title">
        <SectionTransition kind="work-method" contained />
        <div className="container">
          <div className="section-intro" data-scroll-reveal>
            <div>
              <p className="eyebrow">
                <span className="section-number">03 /</span> How we work
              </p>
              <h2 id="approach-title">{homeCopy.approach.title}</h2>
            </div>
            <p>{homeCopy.approach.body}</p>
          </div>
          <ol className="process-list" data-scroll-reveal>
            {[
              ['Investigate', 'Start with a question. Understand the context and the constraints.'],
              ['Prototype', 'Make an idea tangible. Build enough to test the assumptions.'],
              ['Evaluate', 'Examine what works, what fails, and what remains uncertain.'],
              [
                'Develop & share',
                'Take useful results further. Document the learning along the way.',
              ],
            ].map(([title, body], i) => (
              <li key={title} data-scroll-focus>
                <div className="process-step">
                  <span className="process-number">0{i + 1}</span>
                  <ProcessGlyph stage={i} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        id="collaboration"
        className="container section collaboration-section"
        aria-labelledby="collaboration-title"
      >
        <SectionTransition kind="method-collaboration" />
        <div>
          <p className="eyebrow">
            <span className="section-number">04 /</span> Applied collaboration
          </p>
          <h2 id="collaboration-title">{homeCopy.collaboration.title}</h2>
          <AmbientSignal />
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
      <div className="home-contact-transition" aria-hidden="true">
        <SectionTransition kind="collaboration-contact" contained />
      </div>
    </>
  );
}
