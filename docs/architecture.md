# ClearCheck architecture

## Runtime flow

1. The user enters a message or URL in the client-side checker.
2. `validateInput` rejects empty, oversized, or incompatible input.
3. `analyze` resolves the selected mode and invokes the pure message and/or URL analyzers.
4. Rules return stable IDs, severity, exact evidence, explanations, actions, and limitations.
5. `analyze` aggregates findings into a qualified assessment and de-duplicates actions and unknowns.
6. React renders the report from the returned data. The original input remains only in component state.

Image flow:

1. The user selects a local PNG, JPEG, or WebP under the 8 MB limit.
2. A temporary object URL is used only for the preview.
3. Tesseract.js receives the local file in a browser worker configured with same-origin worker, WASM, and English model paths.
4. `jsqr` receives local canvas pixels and returns an untrusted payload, if present.
5. OCR text and QR payload remain editable until the user explicitly asks ClearCheck to analyze them.

Recovery flow:

`src/lib/recovery-coach.ts` maps a typed incident scenario to a deterministic, prioritized checklist. React owns only selected scenario and checkbox state; no incident details are persisted or transmitted.

## Deliberate boundaries

- No API routes are used for the checker.
- No user content is written to a database, local storage, analytics event, or error payload.
- URLs are parsed with the platform `URL` API. No DNS, redirect, page, or reputation request is made.
- OCR and QR assets are served locally from `public/ocr/` and `public/`; Tesseract and QR code paths are never configured to use a CDN.
- OCR assets are runtime-cacheable by the scoped service worker after first use, but they are not part of the initial offline-ready shell because of their size.
- Untrusted input is inserted into React text nodes, never interpreted as HTML.
- The site uses self-contained CSS and does not request external fonts or tracking scripts.

## Ruleset version

The engine returns `rulesetVersion: "1.0.0"` on every report. A rule change should update the version and its tests so reports remain explainable.
