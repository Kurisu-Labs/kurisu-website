import { z } from 'zod';
import { safeUrl } from './markdown';
const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase hyphenated slug');
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Use a real ISO calendar date');
const externalUrl = z
  .string()
  .refine(
    (value) => safeUrl(value) && /^https?:\/\//.test(value),
    'Use a safe absolute HTTP(S) URL',
  );
const approval = z
  .object({ reviewer: text, approvedAt: dateSchema, permittedAttribution: text })
  .strict();
const base = {
  slug,
  title: text,
  summary: text,
  publicationState: z.enum(['draft', 'public']).default('draft'),
  approval: approval.optional(),
  areas: z.array(text).default([]),
  body: text,
};
export const mediaSchema = z
  .object({
    src: z.string().regex(/^\/media\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp|avif)$/),
    alt: text,
    caption: text,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();
export const projectSchema = z
  .object({
    ...base,
    kind: z.literal('project'),
    type: z.enum(['tool', 'infrastructure', 'application', 'proof-of-concept']),
    status: z.enum(['experiment', 'incubating', 'active', 'archived']),
    attribution: z.enum(['kurisu-project', 'collaboration', 'member-prior-work']),
    attributionNote: text,
    ecosystems: z.array(text).default([]),
    contributors: z.array(text).min(1),
    period: text,
    statusReviewedAt: dateSchema,
    featured: z.boolean().default(false),
    problem: text,
    approach: text,
    findings: text.optional(),
    limitations: text,
    nextSteps: text.optional(),
    links: z
      .object({
        repository: externalUrl.optional(),
        docs: externalUrl.optional(),
        demo: externalUrl.optional(),
        video: externalUrl.optional(),
      })
      .strict()
      .default({}),
    demoEnvironment: z.enum(['testnet', 'local', 'production']).optional(),
    relatedNotes: z.array(slug).default([]),
    media: z.array(mediaSchema).default([]),
    license: z
      .object({
        name: text,
        evidenceUrl: externalUrl,
        verifiedAt: dateSchema,
        openSource: z.literal(true),
      })
      .strict()
      .optional(),
    funding: z.array(z.object({ label: text, evidenceUrl: externalUrl }).strict()).default([]),
  })
  .strict();
export const researchSchema = z
  .object({
    ...base,
    kind: z.literal('research'),
    type: z.enum(['research-note', 'experiment-report', 'technical-guide']),
    authors: z.array(text).min(1),
    publishedAt: dateSchema,
    updatedAt: dateSchema.optional(),
    media: z.array(mediaSchema).default([]),
    relatedProjects: z.array(slug).default([]),
    sources: z
      .array(
        z.object({ title: text, url: externalUrl, accessedAt: dateSchema.optional() }).strict(),
      )
      .default([]),
  })
  .strict();
export const recordSchema = z.discriminatedUnion('kind', [projectSchema, researchSchema]);
export type ContentRecord = z.infer<typeof recordSchema>;
export type ContentMedia = z.infer<typeof mediaSchema>;
export type Project = Omit<z.infer<typeof projectSchema>, 'approval' | 'publicationState'>;
export type ResearchNote = Omit<z.infer<typeof researchSchema>, 'approval' | 'publicationState'>;
export type PublicManifest = { projects: Project[]; research: ResearchNote[] };
export const publicProjectSchema = projectSchema
  .omit({ approval: true, publicationState: true })
  .strip();
export const publicResearchSchema = researchSchema
  .omit({ approval: true, publicationState: true })
  .strip();
