import { createRoot } from 'react-dom/client';
import { project, note, marker } from '../fixtures/records';
import { publicProjectSchema, publicResearchSchema } from '@/lib/content/schema';
import { ProjectLayout } from '@/components/project-layout';
import { ArticleLayout } from '@/components/article-layout';
import { WorkList } from '@/components/work-list';
import '../../app/globals.css';

const archive = publicProjectSchema.parse({
  ...project,
  slug: 'qa-fixture-archived',
  status: 'archived',
  links: {
    demo: 'https://example.com/demo',
    repository: 'https://example.com/repository',
    docs: 'https://example.com/docs',
    video: 'https://example.com/video',
  },
  demoEnvironment: 'testnet',
  media: [
    {
      src: '/media/qa-figure.png',
      alt: 'Two labeled boxes connected by an arrow in a synthetic test diagram.',
      caption: 'QA illustration only. Not an architecture or research result.',
      width: 960,
      height: 480,
    },
  ],
  license: {
    name: 'MIT',
    evidenceUrl: 'https://example.com/license',
    verifiedAt: '2026-10-01',
    openSource: true,
  },
});
const active = publicProjectSchema.parse(project);
const article = publicResearchSchema.parse({
  ...note,
  media: archive.media,
  body: `${note.body}\n\n[![Two boxes in a synthetic test diagram](/media/qa-figure.png "QA illustration only. Not a research result.")](https://example.com)\n\n![Two boxes in a synthetic test diagram][diagram]\n\n[diagram]: /media/qa-figure.png "Reference-image rendering check"`,
});
const view = new URLSearchParams(location.search).get('view') ?? 'article';
createRoot(document.getElementById('root')!).render(
  <>
    <header
      className="container"
      style={{ borderBottom: '2px solid var(--color-brand)', paddingBlock: 20 }}
    >
      <p className="meta">{marker}</p>
      <nav aria-label="Fixture navigation" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <a href="?view=article">Article</a>
        <a href="?view=project">Project</a>
        <a href="?view=archived">Archived</a>
        <a href="?view=index">Work index</a>
      </nav>
    </header>
    <main>
      {view === 'article' ? (
        <ArticleLayout note={article} projects={[active]} />
      ) : view === 'index' ? (
        <section className="container section">
          <h1>QA Work index</h1>
          <WorkList projects={[active, archive]} />
        </section>
      ) : (
        <ProjectLayout project={view === 'archived' ? archive : active} notes={[article]} />
      )}
    </main>
  </>,
);
