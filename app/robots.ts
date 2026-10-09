import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { indexable } from '@/lib/deployment';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', ...(indexable ? { allow: '/' } : { disallow: '/' }) }],
    ...(indexable ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
