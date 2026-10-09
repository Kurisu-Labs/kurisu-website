# Kurisu Labs website

A complete, content-led Next.js website for an independent research and engineering collective. The initial public site is research-first: Home, Research, About, Contact, Privacy and a custom 404. Work, project and research article templates are implemented but remain unavailable until real content is approved.

## Run locally

Use Node **24.13.0** (see `.nvmrc`) and npm. Dependencies are pinned in the single `package-lock.json`.

```sh
nvm use
npm ci
npm run dev
```

Open `http://localhost:3000`. No credentials, database, API service, hosted CMS or environment secrets are required. The site uses local font files and assets and does not fetch GitHub content at runtime.

## Commands

| Command                       | Purpose                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Validate content, generate the public manifest, start Next development server                                    |
| `npm run content:check`       | Validate files, approval, links, media dimensions and relations; generate `.generated/public-content.json`       |
| `npm run lint`                | ESLint CLI, with warnings treated as failures                                                                    |
| `npm run typecheck`           | Generate manifest/Next route types and run strict TypeScript                                                     |
| `npm test`                    | Non-watch unit, rendering and route integration tests                                                            |
| `npm run build`               | Content validation, production Next build and public output audit                                                |
| `npm start`                   | Serve the production build                                                                                       |
| `npm run test:e2e`            | Start production server on 3100 and isolated harness on 4173; run Chromium desktop/mobile and Firefox tests      |
| `npm run test:harness`        | Local-only fixture renderer on 127.0.0.1:4173                                                                    |
| `npm run qa:capture`          | Capture pages and template screenshots and local performance measurements (servers on 3100/4173 must be running) |
| `npm run assets:build`        | Reproduce cropped logo/icons/fonts from the original and installed IBM packages                                  |
| `npm run check:public-output` | Check existing production artifacts and sitemap for draft/fixture/internal leakage                               |

Install browser binaries once before browser tests:

```sh
npx playwright install chromium firefox
npm run build
npm run test:e2e
```

The browser suite starts and stops its own two servers; those ports must be free. Screenshots, traces and reports stay in ignored `.qa/`, `test-results/` and `playwright-report/` directories. Tests with synthetic data run outside the application, never through a hidden Next route.

## Structure

- `app/`: server-rendered pages, metadata, sitemap, robots and generated social image.
- `components/`: shared editorial layouts; small client components for navigation and copy feedback.
- `lib/site-content.json`: intended public identity, copy and research directions.
- `lib/content/`: strict Zod schemas, Markdown validation, approval filtering and public manifest access.
- `content/projects/`, `content/research/`: explicit allowlisted `.md` files only; empty is valid.
- `authoring/`: non-published authoring examples.
- `public/brand/`, `public/fonts/`: original identity, display derivatives and local licensed fonts.
- `tests/harness/`: isolated, conspicuously synthetic component QA.

## Publish content

Use trusted, repository-local Markdown with YAML frontmatter. Raw HTML and executable MDX are deliberately unsupported. Only exact `.md` files immediately inside the two content directories load; subfolders, symlinks and `.md.example`/`.mdx.example` files do not.

1. Obtain the owner's approval for the actual work, authorship and relationship to Kurisu. A public repository alone does not establish attribution.
2. Copy an example from `authoring/` into a local/private authoring location. Fill real facts, dates, limitations and sources. The filename must equal `<slug>.md`.
3. Record the real approval under `approval: { reviewer, approvedAt, permittedAttribution }`, then set `publicationState: public`. Do not invent a reviewer to pass validation. Missing publication state defaults to draft; explicitly public content without approval fails.
4. Put the reviewed file into `content/projects/` or `content/research/`. Run `npm run content:check`, tests and build. Restart dev or rerun `content:check` after content edits; the app reads the generated public manifest.
5. Inspect its route, social metadata, sitemap and related links. Deploy only through a separately authorized release.

The public manifest removes approval metadata and drafts before the application is bundled. Navigation, home selections, route resolution, related items, static parameters and sitemap share that manifest. No project means `/work` returns 404 and Work is absent from navigation/sitemap. Approved work activates it automatically.

**A public Git repository exposes every committed file and its history.** Draft flags only control the built website. Keep confidential drafts, approval discussions, personal details and internal planning out of public Git history. This application has no draft URL, preview password or public fixture switch.

### Metadata and evidence

Project types: `tool`, `infrastructure`, `application`, `proof-of-concept`. Status: `experiment`, `incubating`, `active`, `archived`. Attribution: `kurisu-project`, `collaboration`, `member-prior-work` plus a specific `attributionNote` and approved contributors. Funding never represents maturity.

Research types: `research-note`, `experiment-report`, `technical-guide`. Research requires approved authors and a real `publishedAt`; optional `updatedAt` cannot precede it. Dates use quoted ISO calendar dates. Relations refer to existing public slugs in the opposite collection; public links cannot point to unpublished pages.

Artifacts are optional; omit missing links. A demo requires `demoEnvironment: testnet | local | production`. The open-source label requires a repository plus `license: { name, evidenceUrl, verifiedAt, openSource: true }`, supplied only after a real license review. Funding requires a real label and evidence URL.

Use safe HTTP(S) artifact/source URLs. Markdown permits HTTP(S), mailto, public route links and heading anchors; no javascript/data URLs, raw HTML or external images. H2+ headings receive unique anchors. At least four H2s adds a TOC. Code and tables scroll in labeled local regions.

Put approved images under `public/media/`. Declare each in the entry's `media` array with `src`, meaningful `alt`, `caption`, actual pixel `width` and `height`. Validation checks the file and dimensions. Markdown image title text is its caption; direct, linked and reference images are supported. Example syntax: `![Meaningful description](/media/figure.png "Evidence scope and caption")`. Unapproved media must not enter `public/`.

## Identity and assets

The original `public/brand/kurisu-logo-original.png` is preserved byte-for-byte (SHA-256 `1bf9fdb8d8a3815c914ce6c374d2ae1ffcc1331c050c8052c0c857f89aeceb71`). Display crop: source rectangle `(354,367,547,495)`, resized to 548×496 WebP. Icons: 32×32, 180×180 and 192×192 PNG. No vector reconstruction or optical redesign. The 1200×630 social preview uses the same identity and a local IBM font through `next/og`.

IBM Plex Sans 400/500/600 and Mono 400 Latin1 WOFF2 files are served locally; licenses sit alongside them. Brand ownership is not transferred by font licenses. No general software or brand license is asserted by this repository.

## Deployment model

Use standard `npm ci` → `npm run build` → `npm start` on a Node-compatible host. Static export has not been offered or tested. Build tools, including the local content validator, require dev dependencies during the build step. There are no provider-specific runtime services.

Local/preview builds default to `noindex` and disallow crawling. `SITE_INDEXABLE=true` is a **build-time** setting reserved for an authorized live release; it enables robots indexing and the sitemap directive. Canonicals remain `https://kurisulabs.tech`; this is configuration, not a claim that the site is deployed. Robots settings are not access control.

Choose a host and plan compatible with the organization's intended use. Production publication, paid services and domain changes require separate authorization. Preserve all existing Zoho MX/SPF/DKIM/DMARC/verification TXT records and nameservers. The application does not require changing email settings.
