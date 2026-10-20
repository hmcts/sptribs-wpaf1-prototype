# sptribs-wpaf1-prototype

Prototype citizen frontend for the WPAF1 journey — appeal a War Pension or Armed Forces
Compensation Scheme decision, to the First-tier Tribunal War Pensions and Armed Forces
Compensation Chamber. Express 5 + Nunjucks + govuk-frontend, on the `@hmcts-cft/*` starter
stack, on port **3212** (the `sptribs-send-prototype` sibling is 3211, and both are meant to
run at once). Submits to the `StWpaf1` case type, jurisdiction `ST_CIC`, in
`sptribs-case-api`.

Read [`README.md`](README.md) first for how to run it and
[`docs/service-design.md`](docs/service-design.md) for why it is shaped the way it is.

Copied from `sptribs-send-prototype`, which is the same code with a different journey. The
sibling is a useful reference, but anything in it named for SEND35 is wrong here.

## The four things most likely to catch you out

**CCD field ids.** `src/libs/appeal/case-data.ts` maps the draft onto them, and the id is
`<section prefix><CapitalisedProperty>` — `appFirstName` — because each WPAF1 section is a
`@JsonUnwrapped(prefix = …)` complex on `StWpaf1CaseData`. The prefixes are `app`, `rep`,
`apt`, `dsn`, `rsn`, `rec`, `time`, `sup`, `uksf`, `decl`; `dsn` is the decision and `decl`
the declaration, kept deliberately distinct so they cannot be misread for each other.
`SupportingEvidence` is a plain collection, not unwrapped, so its sub-fields carry no prefix.
One wrong id and CCD rejects the **entire** submission, not the field. `case-data.test.ts`
pins the whole set; if you change a question name, reconcile that list against
`build/definitions/StWpaf1/CaseField.json` after `./gradlew generateCCDConfig` in
`sptribs-case-api`.

**`server.ts` imports only `./secrets.js` statically, and `./app.js` dynamically.** Do not
tidy that into a static import. node-config snapshots `process.env` at first import and never
re-reads it, and a static `import { createApp } from "./app.js"` pulls in `#oidc` and `#ccd`,
both of which statically import config. Get it wrong and the app boots, serves every page,
passes its healthcheck and passes its smoke tests — then sign-in fails at the token exchange
with the placeholder client secret from `config/default.json`. `secrets.test.ts` walks the
static import graph and guards it.

**Every Key Vault secret needs an explicit `alias:`** in both chart values files.
`getPropertiesVolumeSecrets` names the environment variable after the alias and falls back to
the file name, so a bare `idam-ui-secret` arrives as `process.env["idam-ui-secret"]`, which
`config/custom-environment-variables.json` never reads. Same invisible failure as above.
`charts/chart.test.ts` is the guard.

**Page content keys are merged over `res.locals`.** A key with the same name as one in
`src/locales/en.ts` replaces it for that page. This is not theoretical: `feedback` on the
confirmation page shadowed the locale's `feedback` object, and because
`String.prototype.link` is a legacy method the phase banner's `href` became a function's
source and its link lost its text. `journey.test.ts` now guards against it.

## The compliance gate

The gate is linear and it runs **before** the hub: `/appeal/where-do-you-live`,
`/appeal/which-scheme`, `/appeal/decision-date`, `/appeal/reconsideration`,
`/appeal/decision-letter-check`. Its answers decide whether there is an admissible appeal at
all, which is not a thing to leave as an unticked task. (SEND35 has a single eligibility
question instead; do not expect the shapes to match.)

`src/libs/appeal/deadline.ts` holds rule 21 and `appealTimeliness` is the one predicate the
gate branches on — nothing else in the journey re-derives it:

- `inTime` — within 12 months of the decision letter (rule 21(1)): straight on.
- `late` — 12 to 24 months (rule 21(2)–(3)): `/appeal/appeal-is-late` collects reasons.
- `beyondExtension` — past 24 months (rule 21(4), with 21(7) forbidding extension in terms):
  `/appeal/appeal-is-very-late` explains that the tribunal cannot extend, **still** collects
  reasons, and **still** submits. A tribunal decides admissibility, not a web form.

`/appeal/reconsideration` is reachable only when the scheme is AFCS. Scotland and Northern
Ireland go to `/appeal/cannot-use-this-service`, a complete dead end that creates no case.

## Page conventions

One directory per page — `(appellant-name)/appellant-name.{ts,njk,i18n.ts}`.
`@hmcts-cft/simple-router` strips `(group)` directories from the URL, and any `.ts` file is a
route.

- `const BACK` / `const NEXT` at the top. Branching is a ternary on the validated answer in
  the redirect, not a journey definition.
- A zod schema whose messages are **content keys** (`.min(1, "firstNameRequired")`), resolved
  by `translateErrors` against the page's `errors` map. Every string a citizen sees lives in
  the `.i18n.ts`.
- One private `render()`, shared by GET and the POST failure path.
- `export const GET = [requireRole("citizen"), getHandler]`. The open routes are `/`, the five
  gate pages, `/appeal/appeal-is-late`, `/appeal/appeal-is-very-late` and
  `/appeal/cannot-use-this-service`. Everything else requires the role.
- `.njk` basenames must be globally unique — nunjucks resolves by basename across a flat
  search path.
- A content module may export `en` as a **function** of the view model where a string
  interpolates (the task list's progress line, the confirmation panel). A per-key function
  does not work: it lands in the template as a function.
- Optional dates pass `required: ""` to `parseDayMonthYear`, which is what makes all three
  parts blank acceptable.

The task list and check-your-answers are components over `src/libs/appeal/sections.ts` and
`summary.ts`. Adding a question is one entry in the manifest, not an edit to either page. Keep
`applicableTasks` / `requiredTasks` / `readyToSubmit` / `completedCount` as they are: `applies`
hides the conditional runs (representative, appointee, still serving, UKSF), and
`optional: true` tasks are excluded from both the numerator and the denominator of the "N of M
sections" count, so the count can reach its total.

## Testing

- `yarn test` — vitest. Colocated `*.test.ts`, plus `src/pages/journey.test.ts`, which sweeps
  every page in the journey: it renders, has a title, posts with a CSRF token, can show every
  error message it declares, and shadows no locale key. Plus `navigation.test.ts` (a group's
  questions chain through each other, only the last returns to the hub) and
  `service-header.test.ts` (every page shows the service name and links back into it).
- `yarn test:a11y` — vitest + jsdom + axe over every page's markup, with nothing running. The
  CNP pipeline runs it in the unit-test stage, before anything is deployed, so it cannot hit a
  URL. jsdom has no layout, so contrast and focus order belong to the browser run.
- `yarn test:e2e` — playwright against the local cftlib stack. Every page it visits is checked
  with axe for WCAG 2.2 AA. Keep it that way: it is the cheap half of Service Standard point 5,
  and the only automated check on it.
- `yarn lint` — biome. `yarn lint:fix` for formatting.

## Do not

- Write to CCD before the declaration — an abandoned appeal must leave no case behind, and
  nothing at all is written on the Scotland/NI path.
- Add a document upload without CDAM, virus scanning and a retention policy.
- Put the case reference in a URL.
- Reintroduce a config-driven journey engine. The pages are hand-written on purpose; the
  sibling `tfs-frontend` spike is the engine-driven approach and this is deliberately not it.
- Move the late-appeal reasons into the hub. They are input to a decision about whether the
  appeal exists at all, not another answer about it.
