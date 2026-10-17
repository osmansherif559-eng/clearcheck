# Privacy and threat model

## Protected data

The user may paste private messages, account details, authentication codes, payment information, or links. ClearCheck treats all input as untrusted and potentially sensitive.

## Mitigations in this MVP

- Input is analyzed in the browser by deterministic code.
- There is no application backend, database, account system, analytics, or external AI call.
- The checker does not visit submitted URLs or follow redirects.
- Uploaded images are validated client-side, previewed through temporary object URLs, and released when replaced or unmounted.
- OCR/QR processing is local. Tesseract worker/core/model paths are same-origin repository assets; no remote AI or CDN model URL is used.
- Decoded QR payloads are treated as untrusted text and are never navigated to or fetched.
- Inputs are limited to 12,000 characters and malformed data returns a controlled result.
- React renders input-derived evidence as text, not HTML.
- The app does not intentionally log, persist, or transmit the original input.
- The report states unknowns and does not display unsupported probabilities.
- The production build uses a lockfile and pinned Node runtime.

## Residual risks

- The initial application bundle must be downloaded from its host before local analysis can run.
- Browser history, screenshots, clipboard contents, and extensions are outside the application's control.
- Rule-based analysis can miss novel or obfuscated attacks and can produce false positives.
- OCR can misread characters, URLs, names, and numbers. The editable review step is required before OCR text is analyzed.
- Large OCR assets can be evicted from browser storage or unavailable until first loaded, especially offline on a new device.
- Dependency and hosting compromise remain deployment concerns and require regular updates.

## Release checks

Before public release, verify browser network activity on the deployed build, run a dependency audit, and perform keyboard/contrast checks on the target browser matrix.
