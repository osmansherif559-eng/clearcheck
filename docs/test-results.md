# Test results

## Local verification

Run from the repository root. Last verified during the MVP build:

```text
npm test             # passed: 2 files, 9 tests
npm run typecheck    # passed
npm run lint         # passed
npm run build        # passed: 6 static application routes
npm audit --omit=dev # passed: 0 production vulnerabilities
```

The engine test suite covers urgent authentication-code requests, recruitment fees, routine reminders, deceptive hostnames, legitimate long URLs, malformed input, input limits, and embedded links. A production server smoke test also returned the homepage, checker, and privacy routes successfully on `http://localhost:3000`.

## Known gaps

- Docker build/startup could not be run in the development container because Docker is unavailable.
- Browser automation and a full accessibility audit are not included in the MVP dependency set.
- No accuracy or real-world detection rate is claimed.
