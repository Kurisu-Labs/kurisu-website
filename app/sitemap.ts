import { getPublicManifest } from '@/lib/content/public';
import { sitemapEntries } from '@/lib/site';
export default async function sitemap() {
  return sitemapEntries(await getPublicManifest());
}
