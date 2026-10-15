import { notFound } from 'next/navigation';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { WorkList } from '@/components/work-list';
import { PublicRepositoryList } from '@/components/public-repository-list';
import { publicRepositories } from '@/lib/public-repositories';
import { AmbientSignal } from '@/components/ambient-signal';
import { ContactTransition, SectionTransition } from '@/components/section-transition';
export async function generateMetadata() {
  if (!(await getPublicManifest()).projects.length && !publicRepositories.length) notFound();
  return pageMetadata(
    'Work',
    'Explore public Kurisu Labs repositories: rental escrow, shared onchain games, and selective payment evidence.',
    '/work',
  );
}
export default async function Work() {
  const { projects } = await getPublicManifest();
  if (!projects.length && !publicRepositories.length) notFound();
  const groups = [
    [
      'Current work',
      projects.filter(
        (project) => project.status !== 'archived' && project.attribution !== 'member-prior-work',
      ),
    ],
    [
      'Previous work by our members',
      projects.filter(
        (project) => project.status !== 'archived' && project.attribution === 'member-prior-work',
      ),
    ],
    ['Archived work', projects.filter((project) => project.status === 'archived')],
  ] as const;
  return (
    <>
      <section className="container page-intro" data-scroll-reveal>
        <p className="eyebrow">Projects, tools & experiments</p>
        <AmbientSignal />
        <h1>Work</h1>
        <p className="lead">
          Explore what we’re building. Public repositories connect the ideas to their code,
          documentation, and current limitations.
        </p>
      </section>
      <div className="container work-index">
        {publicRepositories.length > 0 && (
          <section className="repository-section page-passage" aria-labelledby="repositories-title">
            <SectionTransition kind="work-repositories" />
            <div className="section-heading" data-scroll-reveal>
              <h2 id="repositories-title">Public repositories</h2>
              <span className="eyebrow">Code & documentation</span>
            </div>
            <PublicRepositoryList repositories={publicRepositories} />
          </section>
        )}
        {groups
          .filter(([, items]) => items.length > 0)
          .map(([label, items]) => (
            <section key={label} className="work-group" data-scroll-reveal>
              <h2 className="mb-6">{label}</h2>
              <WorkList projects={items} />
            </section>
          ))}
      </div>
      <ContactTransition kind="work-contact" />
    </>
  );
}
