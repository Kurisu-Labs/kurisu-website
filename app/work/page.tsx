import { notFound } from 'next/navigation';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { WorkList } from '@/components/work-list';
export async function generateMetadata() {
  if (!(await getPublicManifest()).projects.length) notFound();
  return pageMetadata(
    'Work',
    'Products, tools, and experiments at different stages of development, with scope, attribution, and limitations.',
    '/work',
  );
}
export default async function Work() {
  const { projects } = await getPublicManifest();
  if (!projects.length) notFound();
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
      <section className="container page-intro">
        <p className="eyebrow">Projects, tools & experiments</p>
        <h1>Work</h1>
        <p className="lead">Products, tools, and experiments at different stages of development.</p>
      </section>
      <div className="container pb-24">
        {groups
          .filter(([, items]) => items.length > 0)
          .map(([label, items]) => (
            <section key={label} className="mb-12">
              <h2 className="mb-6">{label}</h2>
              <WorkList projects={items} />
            </section>
          ))}
      </div>
    </>
  );
}
