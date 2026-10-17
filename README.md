# ClearCheck

**Know the warning signs before you act.**

ClearCheck is a privacy-first message and link investigation tool. It explains suspicious signals with evidence from the user's own input and recommends safer next steps.

## What is implemented

- Local-only message and URL analysis in a pure TypeScript engine.
- Evidence-linked findings for urgency, credential requests, payment pressure, impersonation, channel changes, and suspicious URL structure.
- Three qualified assessments: **High concern**, **Needs caution**, and **No major indicators found**.
- Context-specific actions and explicit unknowns instead of unsupported safety or scam probabilities.
- Responsive checker UI with auto-detect, message, and URL modes.
- Polished light and dark themes with system preference detection and local preference persistence.
- Mobile navigation, touch-sized controls, safe-area support, reduced-motion support, and no-zoom viewport behavior.
- Installable PWA metadata, original ClearCheck icons, a scoped service worker, offline shell fallback, and install guidance for Android and iOS Safari.
- Sample cases, reset, copy report, print report, and accessible keyboard focus states.
- Learn, Privacy, and About pages.
- No account, database, history, external AI, reputation API, URL fetching, analytics, or third-party font requests.

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
npm run test:e2e
```

The browser suite starts the production server and verifies CSS rendering, theme switching, mobile navigation, responsive overflow, the sample/analyze/reset flow, no external requests during local analysis, manifest/icon delivery, and offline reload after service-worker preparation. Chromium must be installed for the browser suite; `npx playwright install chromium` is the supported setup command.

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

## PWA installation and offline behavior

ClearCheck is an installable web app, not a native App Store or Google Play application. On supported browsers, use the in-app install prompt or the browser's install menu. On Android Chrome, open the menu and choose **Install app** or **Add to Home screen**. On iPhone/iPad, open the site in Safari, tap **Share**, choose **Add to Home Screen**, and confirm **Add**.

The service worker caches an explicit public app shell and immutable Next static assets. After the production app reports **Offline ready**, the Home and Check routes can reload without a connection. User messages, reports, query-bearing requests, RSC requests, authenticated requests, and non-GET requests are not cached. Offline behavior must still be rechecked on the target browser and deployment; browser storage may be cleared or evicted.

## Design and accessibility

The interface uses centralized semantic design tokens in `src/app/globals.css`. The theme is applied before hydration to reduce flicker, and the interactive theme control persists `light` or `dark` locally while respecting the system preference by default. Keyboard focus rings, skip navigation, semantic labels, accessible status messages, reduced-motion handling, contrast-aware severity styling, and touch-friendly mobile controls are included.

## Limitations

ClearCheck is an assessment and education tool, not a guarantee. It does not verify sender identity, domain ownership, DNS, redirects, page content, malware, or live reputation. A result with no major indicators means only that the configured deterministic rules did not find a significant warning sign.

See [`docs/detection-rules.md`](docs/detection-rules.md), [`docs/architecture.md`](docs/architecture.md), and [`docs/threat-model.md`](docs/threat-model.md) for details.
