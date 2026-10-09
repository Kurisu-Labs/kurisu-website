import type { Metadata, MetadataRoute } from 'next';
import type { PublicManifest } from './content/schema';
import configuration from './site-content.json';

export const site = configuration.site;
export const homeCopy = configuration.home;
export const directions = configuration.directions;
export function publicNavigation(manifest: PublicManifest) {
  return [
    ...(manifest.projects.length ? [{ href: '/work', label: 'Work' }] : []),
    { href: '/research', label: 'Research' },
    { href: '/about', label: 'About' },
    { href: '/#contact', label: 'Contact' },
  ];
}
export function sitemapEntries(manifest: PublicManifest): MetadataRoute.Sitemap {
  return [
    ...['/', '/research', '/about', '/privacy', ...(manifest.projects.length ? ['/work'] : [])].map(
      (route) => ({ url: `${site.url}${route}` }),
    ),
    ...manifest.projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      lastModified: project.statusReviewedAt,
    })),
    ...manifest.research.map((note) => ({
      url: `${site.url}/research/${note.slug}`,
      lastModified: note.updatedAt ?? note.publishedAt,
    })),
  ];
}
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: { canonical: `${site.url}${path}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: `${site.url}${path}`,
      siteName: site.name,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${site.url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'Kurisu Labs — Exploring ideas. Building working systems.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${site.url}/opengraph-image`],
    },
  };
}
export function displayDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
export function humanize(value: string) {
  return value.replaceAll('-', ' ').replace(/^\w/, (first) => first.toUpperCase());
}
