import { notFound } from 'next/navigation';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { ArticleLayout } from '@/components/article-layout';
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getPublicManifest()).research.map((note) => ({ slug: note.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = (await getPublicManifest()).research.find((note) => note.slug === slug);
  if (!note) notFound();
  const metadata = pageMetadata(note.title, note.summary, `/research/${note.slug}`);
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: note.publishedAt,
      ...(note.updatedAt ? { modifiedTime: note.updatedAt } : {}),
      authors: note.authors,
    },
  };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manifest = await getPublicManifest();
  const note = manifest.research.find((note) => note.slug === slug);
  if (!note) notFound();
  return (
    <ArticleLayout
      note={note}
      projects={manifest.projects.filter((project) => note.relatedProjects.includes(project.slug))}
    />
  );
}
