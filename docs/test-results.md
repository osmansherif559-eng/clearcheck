# Test results

## Local verification

Run from the repository root. Last verified during the MVP build:

```text
npm test             # passed: 4 files, 31 tests
npm run typecheck    # passed
npm run lint         # passed
npm run build        # passed: 6 static application routes
npm audit --omit=dev # passed: 0 production vulnerabilities
node --test tests/route-smoke.test.mjs # passed: 3 route/manifest suites
npm run test:e2e     # passed: 9 Playwright browser tests
```

The engine test suite covers urgent authentication-code requests, recruitment fees, routine reminders, deceptive hostnames, legitimate long URLs, malformed input, input limits, multiple embedded links, exact URL evidence, and all recovery scenarios. The route smoke suite checks all public HTML routes, linked CSS delivery, the manifest, and every declared icon. The Playwright suite checks actual computed CSS, theme switching and persistence, mobile navigation and overflow at 390px, sample/analyze/reset behavior, recovery checklist progress, local image preview/QR no-result handling, no cross-origin requests during local analysis, and production offline reload after service-worker preparation.

## Known gaps

- Docker build/startup could not be run in the development container because Docker is unavailable.
- The automated browser matrix directly exercises 390px and the Playwright desktop profile; a full manual device/browser matrix and assistive-technology audit remain deployment checks.
- The automated browser suite runs OCR against a generated browser screenshot and verifies same-origin OCR assets plus editable output. A full manual image-quality/device matrix remains a deployment check; OCR can still misread small, blurred, stylized, or non-English text because only the pinned English model is bundled.
- `npm audit --omit=dev` passed with 0 production vulnerabilities. The full audit still reports five high-severity transitive development-tool findings under `eslint-config-next`/`braces`; the available automated fix requires an unrelated breaking downgrade, so it was not applied to the production stack.
- No accuracy or real-world detection rate is claimed.
