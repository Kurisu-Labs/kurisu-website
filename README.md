# Kurisu Labs website

A complete, content-led Next.js website for an independent research and engineering collective. The public site includes Home, Research, Work, About, Contact, Privacy and a custom 404. Work links a curated set of public Kurisu Labs repositories. Project case-study and research article templates remain unavailable until their actual content is approved.

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

The Experimental Digital Laboratory interface pairs obsidian and off-white with the original maroon (`#6B0C1A`) and readable rose accents, including selected research signals. All accent colors stay within the maroon and rose palette. It uses local IBM Plex fonts and lightweight SVG. The Living Research Network is a server component: native radio controls and CSS expose the existing research descriptions without JavaScript. Its layout follows available width and text size. A small optional motion layer adds pointer lighting, bounded diagram movement, and scroll responses; content stays visible without JavaScript and reduced-motion preferences disable these effects. The original brand asset is preserved on a light tile.

Portfolio columns adapt to available width and enlarged text. A short accent line highlights portfolio cards and workflow steps in the reading area using IntersectionObserver; it never moves the controls. Supporting browsers also draw a hero divider with a native CSS scroll timeline. Hidden or offscreen hero diagrams have no JavaScript scroll handler. Touch scrolling stays native, and no animation runs in a continuous JavaScript loop.

The Research → Public Work → How We Work → Applied Collaboration → Contact boundaries share a decorative maroon rail in their existing padding. A native CSS view timeline draws the rail toward the next heading and moves a small marker as visitors scroll in either direction. The existing visibility observer enables it only while visible; background tabs, reduced motion, no JavaScript, and browsers without scroll-timeline support show the completed static rail. Workflow and contact backgrounds blend across the boundaries. Text, focus targets, and section spacing stay unchanged; Home's rail labels follow its section numbering.

Work, Research, and About reuse this same rail between their main sections and into Contact. Their headings and supporting copy use the existing short entrance animation, while research directions and collective principles gain the existing reading-area accent. Section hosts and deep-link targets remain stationary. The shared contact component stays unchanged; a decorative page-owned boundary introduces it on these three pages. All enhancements use the existing observers and CSS timelines, with static no-JavaScript and reduced-motion fallbacks.

Internal page links use Next.js navigation. After a pathname change commits, a single 260ms Web Animations opacity fade introduces the existing main landmark, including on Back/Forward. Header and footer stay outside the animated region; no extra layout wrapper, outgoing screenshot, navigation timeout, scroll handler, or animation dependency is added. Next retains scroll and focus restoration, while same-page anchors and initial page loads do not trigger the fade. Existing section entrances skip content already visible after route changes so they do not replay after the page fade. Reduced motion, a hidden tab, and a subsequent navigation cancel any active fade. Browsers without the animation API or JavaScript retain ordinary navigation.

The navigation offers System, Light, and Dark themes. System follows the device preference, including without JavaScript; explicit choices persist locally under `kurisu-theme`. A small head script applies a saved theme before paint. Storage failures keep the current document usable. The light palette uses warm paper, dark ink, and the same maroon identity; the privacy notice describes this local preference.

Fig. 01 has CSS-only orbit, signal, and core animations. It pauses while offscreen, while the tab is hidden, and briefly during pointer movement, then resumes after 600ms of pointer inactivity. Reduced-motion preferences disable it; mobile retains the simpler hero.

The Living Research Network adds an optional center button labeled Next direction. It cycles the same four native radio choices, keeps focus on the button, and announces the selected direction. Direction labels sit above and below a dedicated diagram area, so traces meet their ports without passing behind text. Orbit and signal motion pauses offscreen, in background tabs, and under reduced motion. Content never rotates automatically. Without JavaScript, the original radio explorer remains available; narrow layouts keep the stacked research controls.

Public repository cards include distinct SVG concept sketches based on their published descriptions, rather than product screenshots or invented results. Their signals and layers loop smoothly while visible, without requiring hover or a new scroll entrance. Workflow glyphs and shared signals in the mobile hero, collaboration, contact, and secondary page introductions use the same visible-only playback system. One IntersectionObserver controls these CSS transform/opacity loops; they pause offscreen and in background tabs, add no runtime dependencies, and remain static without JavaScript or with reduced motion.

Decorative motion runs automatically while visible, with no manual pause controls or stored motion preference. The device's reduced-motion preference always takes precedence. Fine-pointer hover adds shallow perspective to repository illustrations using the existing event-driven pointer handler, plus small lifts on workflow glyphs, brand artwork, and article media. Inner idle loops keep their phase. Touch layouts and reduced-motion layouts omit these transforms.

- `app/`: server-rendered pages, metadata, sitemap, robots and generated social image.
- `components/`: shared editorial layouts; small client components for navigation, copy feedback, and decorative motion.
- `lib/site-content.json`: intended public identity, copy and research directions.
- `lib/public-repositories.ts`: reviewed public repository links and brief README-based descriptions; no runtime GitHub access.
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

The public manifest removes approval metadata and drafts before the application is bundled. Case-study selections, detail route resolution, related items and static parameters share that manifest. The Work index, navigation and sitemap also include the separately reviewed public repository catalog. A catalog entry creates an external GitHub link, never a `/work/[slug]` case study. If both the catalog and approved projects are empty, `/work` returns 404 and Work is absent from navigation/sitemap.

### Public repository portfolio

The owner authorized links to public repositories in `Kurisu-Labs`, excluding this website and every private repository. On 2026-10-15, the unauthenticated public organization endpoint (`https://api.github.com/orgs/Kurisu-Labs/repos?type=public&per_page=100`) returned `rentra`, `ruin-relay`, `zecsolve`, and `kurisu-website`; the website is excluded. The catalog records the three included repositories, their API-reported primary language, README source URL and README blob revision. Descriptions summarize the README's stated purpose and scope, without importing contributors, performance claims, stars, or case-study attribution.

To refresh the catalog, inspect the unauthenticated public API and each public README, check all pages if the API is paginated, then review the static entries. Never list authenticated private repositories, add private names as placeholders, or infer publication permission for a case study from a public repository. Remove an entry if it is no longer public. The site performs no GitHub requests at runtime and needs no GitHub token. Current source READMEs: [Rentra](https://github.com/Kurisu-Labs/rentra/blob/main/README.md), [Ruin Relay](https://github.com/Kurisu-Labs/ruin-relay/blob/main/README.md), and [zecsolve](https://github.com/Kurisu-Labs/zecsolve/blob/main/README.md).

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

### Netlify setup

Connect `Kurisu-Labs/kurisu-website`, branch `main`, using the Free plan. The included `netlify.toml` sets `npm run build`, the `.next` publish directory, Node 24.13.0 and installation of development dependencies required by the build. Netlify's automatic Next.js adapter handles deployment; do not upload `.next` as a plain static site or add an SPA catch-all redirect.

The verified live domain is `https://kurisulabs.tech`. The production context in `netlify.toml` enables `SITE_INDEXABLE=true`; deploy previews, branch deploys and local development remain non-indexable. A paid plan, add-on or trial is not required by this application; stay within the Free plan limits and review the account's usage settings.

Keep DNS with the existing registrar. Add the custom domain to Netlify first, then use the website-specific targets shown in its domain panel. Preserve all existing email and verification records. No account IDs, access tokens or DNS credentials belong in this repository.
