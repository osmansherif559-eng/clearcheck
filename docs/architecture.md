# ClearCheck architecture

## Runtime flow

1. The user enters a message or URL in the client-side checker.
2. `validateInput` rejects empty, oversized, or incompatible input.
3. `analyze` resolves the selected mode and invokes the pure message and/or URL analyzers.
4. Rules return stable IDs, severity, exact evidence, explanations, actions, and limitations.
5. `analyze` aggregates findings into a qualified assessment and de-duplicates actions and unknowns.
6. React renders the report from the returned data. The original input remains only in component state.

## Deliberate boundaries

- No API routes are used for the checker.
- No user content is written to a database, local storage, analytics event, or error payload.
- URLs are parsed with the platform `URL` API. No DNS, redirect, page, or reputation request is made.
- Untrusted input is inserted into React text nodes, never interpreted as HTML.
- The site uses self-contained CSS and does not request external fonts or tracking scripts.

## Ruleset version

The engine returns `rulesetVersion: "1.0.0"` on every report. A rule change should update the version and its tests so reports remain explainable.
