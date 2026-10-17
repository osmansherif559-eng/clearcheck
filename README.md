# ClearCheck

**Know the warning signs before you act.**

ClearCheck is a privacy-first message and link investigation tool. It explains suspicious signals with evidence from the user's own input and recommends safer next steps.

## What is implemented

- Local-only message and URL analysis in a pure TypeScript engine.
- Evidence-linked findings for urgency, credential requests, payment pressure, impersonation, channel changes, and suspicious URL structure.
- Three qualified assessments: **High concern**, **Needs caution**, and **No major indicators found**.
- Context-specific actions and explicit unknowns instead of unsupported safety or scam probabilities.
- Responsive checker UI with auto-detect, message, and URL modes.
- Sample cases, reset, copy report, print report, and accessible keyboard focus states.
- Learn, Privacy, and About pages.
- No account, database, history, external AI, reputation API, URL fetching, analytics, or third-party fonts.

## Requirements

- Node.js `22.23.3` (pinned in `.nvmrc`)
- npm 10+
- Docker is optional for container deployment

## Setup

```bash
npm ci
```

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The core analysis is performed in the browser after the application loads. Submitted content is not sent to a server or saved as investigation history.

## Checks

Run the single test command:

```bash
npm test
```

Additional project checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Production run

```bash
npm run build
npm run start
```

## Docker

```bash
docker build -t clearcheck .
docker run --rm -p 3000:3000 clearcheck
```

Docker exposes only port `3000`. The local development environment used to build this MVP did not have Docker installed, so the Docker commands must be verified on a machine with Docker before release.

## Architecture

The application uses Next.js App Router and TypeScript. The analysis engine is independent from React components:

```text
src/lib/analysis/types.ts       public contracts and ruleset version
src/lib/analysis/analyze.ts     input validation and aggregation
src/lib/analysis/message-rules.ts
                                explainable message rules
src/lib/analysis/url-analysis.ts
                                standard URL parser and URL rules
src/components/checker/         input workflow and local state
src/components/results/         evidence-linked report
```

The browser never opens or fetches a submitted URL. For a message containing a link, ClearCheck parses the visible URL text and reports what can be observed locally.

## Limitations

ClearCheck is an assessment and education tool, not a guarantee. It does not verify sender identity, domain ownership, DNS, redirects, page content, malware, or live reputation. A result with no major indicators means only that the configured deterministic rules did not find a significant warning sign.

See [`docs/detection-rules.md`](docs/detection-rules.md), [`docs/architecture.md`](docs/architecture.md), and [`docs/threat-model.md`](docs/threat-model.md) for details.
