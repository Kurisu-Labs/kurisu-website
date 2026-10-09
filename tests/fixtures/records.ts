// Synthetic data is imported only by unit tests and the separate local Vite harness.
export const marker = 'QA FIXTURE: NOT A KURISU PROJECT';
export const approval = {
  reviewer: 'QA reviewer',
  approvedAt: '2026-10-01',
  permittedAttribution: 'Synthetic QA attribution only',
};
export const project = {
  kind: 'project',
  slug: 'qa-fixture-system',
  title: `${marker}: an intentionally long experimental systems title`,
  summary: 'Synthetic test content for checking project templates, never a portfolio claim.',
  publicationState: 'public',
  approval,
  type: 'proof-of-concept',
  status: 'experiment',
  attribution: 'member-prior-work',
  attributionNote: 'Prior work by a fictional QA contributor. No real Kurisu affiliation.',
  areas: ['Test tooling'],
  ecosystems: ['Synthetic test network'],
  contributors: ['QA contributor'],
  period: '2026',
  statusReviewedAt: '2026-10-01',
  featured: true,
  problem:
    'Can an isolated test exercise every project layout without publishing a fictional project?',
  approach:
    'Render shared components in a local test harness that is outside the Next.js application.',
  findings: 'This is illustrative test prose, not an observed research result.',
  limitations: 'Synthetic fixture. It provides no evidence about a real system.',
  links: {},
  relatedNotes: [],
  body: 'A synthetic **project record** with no public artifacts.',
};
export const note = {
  kind: 'research',
  slug: 'qa-fixture-note',
  title: 'QA FIXTURE: Testing article structure with a deliberately long title',
  summary: 'Synthetic text for article rendering. Not a Kurisu publication.',
  publicationState: 'public',
  approval,
  type: 'technical-guide',
  areas: ['Testing'],
  authors: ['QA author'],
  publishedAt: '2026-10-01',
  relatedProjects: [],
  sources: [{ title: 'Example reference', url: 'https://example.com/reference' }],
  body: `## Question\n\nThis is an isolated article fixture. A [safe reference](https://example.com) and an inline \`token\`.\n\n## Approach\n\n\`\`\`typescript\nconst deliberatelyLongLine = "This code region is deliberately very wide so a narrow screen must scroll the code locally and preserve a useful readable page layout.";\n\`\`\`\n\n## Findings\n\n| Scenario | Method | A deliberately wide table heading with detailed context |\n| --- | --- | --- |\n| Small viewport | Isolated renderer | Wide_content_that_cannot_reflow_without_a_local_scroll_region_and_should_not_expand_the_page |\n\n## Limitations\n\nThis is not an actual study.\n\n## Next questions\n\n- Can the headings be followed by keyboard?\n- Does copy failure preserve readable code?\n\n## Next questions\n\nRepeated headings need distinct anchors.`,
};
