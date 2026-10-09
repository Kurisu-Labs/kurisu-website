import { notFound } from 'next/navigation';
import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata } from '@/lib/site';
import { ProjectLayout } from '@/components/project-layout';
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getPublicManifest()).projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = (await getPublicManifest()).projects.find((project) => project.slug === slug);
  if (!project) notFound();
  return pageMetadata(project.title, project.summary, `/work/${project.slug}`);
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const manifest = await getPublicManifest();
  const project = manifest.projects.find((project) => project.slug === slug);
  if (!project) notFound();
  return (
    <ProjectLayout
      project={project}
      notes={manifest.research.filter((note) => project.relatedNotes.includes(note.slug))}
    />
  );
}
