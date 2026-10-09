import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPublicManifest } from '@/lib/content/core';
import { project, note } from '../fixtures/records';

const state = vi.hoisted(() => ({ manifest: { projects: [], research: [] } as unknown }));
vi.mock('@/lib/content/public', () => ({ getPublicManifest: async () => state.manifest }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  },
}));
import WorkPage, { generateMetadata as workMetadata } from '@/app/work/page';
import ProjectPage, {
  generateStaticParams as projectParams,
  generateMetadata as projectMetadata,
} from '@/app/work/[slug]/page';
import ArticlePage, {
  generateStaticParams as noteParams,
  generateMetadata as noteMetadata,
} from '@/app/research/[slug]/page';
import { renderToStaticMarkup } from 'react-dom/server';

beforeEach(() => {
  state.manifest = createPublicManifest([]);
});
describe('real route handlers consume approved records only', () => {
  it('empty index and unknown detail/metadata invoke 404 with no enumerated slugs', async () => {
    await expect(WorkPage()).rejects.toThrow(/404/);
    await expect(workMetadata()).rejects.toThrow(/404/);
    expect(await projectParams()).toEqual([]);
    expect(await noteParams()).toEqual([]);
    const params = Promise.resolve({ slug: 'private-draft' });
    await expect(ProjectPage({ params })).rejects.toThrow(/404/);
    await expect(projectMetadata({ params })).rejects.toThrow(/404/);
    await expect(ArticlePage({ params })).rejects.toThrow(/404/);
    await expect(noteMetadata({ params })).rejects.toThrow(/404/);
  });
  it('approved detail routes, metadata, grouping and related entries work', async () => {
    state.manifest = createPublicManifest([
      { ...project, relatedNotes: [note.slug] },
      { ...note, relatedProjects: [project.slug] },
      { ...project, slug: 'qa-archived', status: 'archived' },
    ]);
    expect(await projectParams()).toEqual([{ slug: project.slug }, { slug: 'qa-archived' }]);
    expect(await noteParams()).toEqual([{ slug: note.slug }]);
    const params = Promise.resolve({ slug: project.slug });
    expect((await projectMetadata({ params })).alternates?.canonical).toBe(
      `https://kurisulabs.tech/work/${project.slug}`,
    );
    expect(renderToStaticMarkup(await ProjectPage({ params }))).toContain('Related research');
    expect(
      renderToStaticMarkup(await ArticlePage({ params: Promise.resolve({ slug: note.slug }) })),
    ).toContain('Related work');
    const index = renderToStaticMarkup(await WorkPage());
    expect(index).toContain('Previous work by our members');
    expect(index).toContain('Archived work');
  });
});
