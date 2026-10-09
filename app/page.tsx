import { getPublicManifest } from '@/lib/content/public';
import { pageMetadata, site } from '@/lib/site';
import { HomeContent } from '@/components/home-content';
export const metadata = pageMetadata('Blockchain research & engineering', site.description, '/');
export default async function Home() {
  return <HomeContent manifest={await getPublicManifest()} />;
}
