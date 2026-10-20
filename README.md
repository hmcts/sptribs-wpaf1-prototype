# sptribs-wpaf1-prototype

A prototype citizen frontend for the **WPAF1** journey — *appeal a War Pension or Armed
Forces Compensation Scheme decision* — for the First-tier Tribunal, War Pensions and Armed
Forces Compensation Chamber (WPAFCC).

Today WPAF1 is a 13-page PDF, emailed or posted to the tribunal. There is no digital service.

It is the citizen half of an end-to-end prototype. The other half is the `StWpaf1` CCD case
type in [`hmcts/sptribs-case-api`](https://github.com/hmcts/sptribs-case-api): an appeal
completed here becomes a case there, which a caseworker then reads in XUI (Manage cases).
`StWpaf1` lives in the existing `ST_CIC` jurisdiction — a jurisdiction of its own would cost
new CCD roles, an `XUI_JURISDICTIONS` entry and an IDAM profile row per user.

This is service #2 of the eight Special Tribunals is bringing onto the platform. Service #1
was SEND35, and this repo was copied from its sibling
[`sptribs-send-prototype`](https://github.com/hmcts/sptribs-send-prototype). The libraries,
middleware, conventions and guard tests are the same code; the journey and the case type are
not.

It is a prototype. It is built to the GDS Service Standard and the GOV.UK Design System
because those are what make a service usable, not because it is finished — see
[`docs/service-design.md`](docs/service-design.md) for what has been decided, what has been
deliberately left out, and why.

## What it does

| | |
|---|---|
| Journey | A linear compliance gate, then a task-list hub over the form's sections — 9 groups and 25 tasks in [`src/libs/appeal/sections.ts`](src/libs/appeal/sections.ts) — then check answers, declaration, confirmation |
| Pattern | GOV.UK start page → compliance gate → sign in → task list hub → question pages → check answers → declaration → confirmation |
| Storage | The part-finished appeal is in the Redis session. Nothing is written to CCD until the declaration is signed. |
| Submission | `create-case` on the `StWpaf1` case type, via the CCD data-store v2 external API |
| Sign-in | IDAM OIDC, as a `citizen`. The start page, the gate and the dead end are open; everything else is `requireRole("citizen")`. |

### The compliance gate

Unlike SEND35, which asks a single eligibility question, WPAF1 runs a linear gate before the
hub: `/appeal/where-do-you-live`, `/appeal/which-scheme`, `/appeal/decision-date`,
`/appeal/reconsideration`, `/appeal/decision-letter-check`.

It is linear, and it is not part of the hub, because those answers decide whether there is an
admissible appeal at all rather than describing one. Nation decides whether this tribunal has
jurisdiction; scheme decides whether the AFCS reconsideration question exists; the decision
date decides whether the appeal is in time. A hub says "answer these in any order and we'll
tell you when you're done", which is the wrong promise to make about any of them.

The decision date has three branches, all in
[`src/libs/appeal/deadline.ts`](src/libs/appeal/deadline.ts), with `appealTimeliness` as the
single predicate `/appeal/decision-date` branches on:

| Timeliness | Window | What happens |
|---|---|---|
| `inTime` | within 12 months of the decision letter — rule 21(1) | straight on |
| `late` | 12 to 24 months — rule 21(2)–(3) | `/appeal/appeal-is-late` collects the reasons the decision maker reads when deciding whether to object |
| `beyondExtension` | past 24 months — rule 21(4) | `/appeal/appeal-is-very-late` explains that the tribunal has **no power to extend** past this point, and rule 21(7) forbids extension in terms. It still collects reasons and still submits. |

Nothing in that last row is a dead end: a tribunal decides whether an appeal is admitted, not
a web form. `apps/sscs/sscs-submit-your-appeal` behaves the same way past its own outer bar.

Scotland and Northern Ireland are an off-ramp, not a branch:
`/appeal/cannot-use-this-service` names PAT Scotland or PAT NI, gives their details and links
the WPAF1 PDF. **No case is created on that path** — not a draft, not a shell.

## Running it locally

You need two things running: the CFT stack (CCD, IDAM, XUI) from cftlib, and this app.

```sh
# 1. The CFT stack — in a sptribs-case-api checkout on a branch with the StWpaf1 case type
cd ../sptribs-case-api
./gradlew bootWithCCD -PlocalAuth

# 2. This app
yarn install          # needs `az login` first: @hmcts-cft/* come from Azure Artifacts
yarn dev              # starts Redis via docker compose, then the app on :3212
```

| Service | Port | Comes from |
|---|---|---|
| This app | 3212 | `yarn dev` |
| Redis | 6379 | `docker-compose.yml` |
| IDAM simulator | 5062 | cftlib (`-PlocalAuth`) |
| S2S simulator | 8489 | cftlib (`-PlocalAuth`) |
| CCD definition store | 4451 | cftlib |
| CCD data store | 4452 | cftlib |
| XUI (Manage cases) | 3000 | cftlib |

3212 rather than 3211 so that this and `sptribs-send-prototype` can run at the same time —
3211 is the sibling's. The port is in `config/default.json` (with `idam.redirectUri` and the
chart's `applicationPort` to match), which is the only place to change it.

Then open <http://localhost:3212>, and sign in as `TEST_CITIZEN_USER@mailinator.com` with
any password. To see the case a caseworker sees, open <http://localhost:3000> and sign in as
`TEST_CASE_WORKER_USER@mailinator.com`.

If the cftlib stack does not come up, `sptribs-case-api`'s own README has the two known
gotchas (XUI losing a start-up race with the IDAM simulator, and a stale Flyway state in the
shared Postgres container). Stop any stray `cms-template` docker stack first — it holds 5062
and masks the real result.

## Tests

```sh
yarn lint          # biome
yarn test          # vitest — the appeal library, and a sweep over every page in the journey
yarn test:a11y     # vitest + jsdom + axe — the markup rules, with nothing running
yarn test:e2e      # playwright — the journey end to end, with an axe check on every page
```

`yarn test` and `yarn test:a11y` need nothing running. `yarn test:e2e` needs the local stack
above: it drives the real OIDC flow and creates real CCD cases.

`test:a11y` is separate because the CNP nodejs pipeline runs it in the unit-test stage, before
anything is deployed, so it cannot hit a URL — it renders the templates into jsdom. jsdom has
no layout, so colour contrast and focus order can only be checked by the browser run.

The e2e suite asserts zero axe-detectable WCAG 2.2 AA violations on every page it visits.
That is the cheap half of Service Standard point 5 and is not a substitute for an audit or
for testing with assistive technology.

Four of the tests exist to catch failures that are otherwise silent, and are worth knowing
about before you change what they guard:

- `src/secrets.test.ts` — walks the static import graph from `server.ts` to prove nothing
  reaches node-config before the secrets load. See below.
- `charts/chart.test.ts` — every Key Vault secret has an explicit `alias:`, and that alias is
  a name `config/custom-environment-variables.json` actually reads.
- `src/pages/navigation.test.ts` — a group's questions chain through each other and only the
  last returns to the hub.
- `src/pages/service-header.test.ts` — every page shows the service name and links back into
  the service. govuk-frontend 6 moved `serviceName` off `govukHeader`, and a template still
  passing it there renders a bare crest without warning.

## How the code is laid out

```
src/
  app.ts                     the whole bootstrap; order of middleware is load-bearing
  server.ts                  loads secrets, then dynamically imports app.ts
  secrets.ts                 getPropertiesVolumeSecrets over charts/…/values.yaml
  libs/
    appeal/                  #appeal — the domain: the draft, the gate's rule 21 logic,
                             the task list, CCD mapping, check-answers rows
    ccd/                     #ccd — the two data-store calls this service makes
    oidc/                    #oidc — IDAM sign-in, and the session user
    zod-validation/          #zod-validation — content-key errors and date parsing
  middleware/                redis (session), csrf, form-action (CSP), cookies
  pages/                     one directory per page — see below
  locales/                   app-wide strings (back, continue, the footer)
```

### The secrets / node-config ordering

`server.ts` statically imports **only** `./secrets.js`, and imports `./app.js` dynamically
after `loadSecrets()` has resolved. Do not tidy that into a static import.

node-config snapshots `process.env` the first time it is imported and never re-reads it, and a
static `import { createApp } from "./app.js"` pulls in `#oidc` and `#ccd`, both of which
statically import config. Get it wrong and the app boots, every page renders, the healthcheck
is green and the smoke tests pass — then sign-in fails at the token exchange, because the
`client_secret` sent to IDAM is the literal placeholder from `config/default.json`. IDAM
answers `invalid_client`, which is also what it says for a wrong secret and for an
unregistered client, so it reads as a credentials problem rather than an ordering one.

`src/secrets.test.ts` walks the import graph and fails if anything reaches config first.

### Key Vault secrets need an explicit alias

In both `charts/sptribs-wpaf1-prototype/values.yaml` and `values.preview.template.yaml`, every
secret is a `{ name, alias }` pair. `getPropertiesVolumeSecrets` names the environment
variable after the `alias`, falling back to the file name — so a bare `idam-ui-secret` arrives
as `process.env["idam-ui-secret"]`, which `custom-environment-variables.json` never reads.
Same silent failure as above: everything green, sign-in broken. `charts/chart.test.ts` is the
guard.

Preview uses `app-insights-connection-string-preview`, a different secret name from AAT's.

### Adding or changing a page

One directory per page, holding the page and nothing else:

```
src/pages/(citizen)/appeal/(appellant-name)/
  appellant-name.ts        GET/POST, the zod schema, and where Back and Continue go
  appellant-name.njk       the template
  appellant-name.i18n.ts   every string on the page, including the error messages
```

`@hmcts-cft/simple-router` turns the path into the URL: `(group)` directories are stripped,
so this is `/appeal/appellant-name`. Any `.ts` file is a route.

The conventions, which every page follows:

- **`const BACK` and `const NEXT` at the top.** Navigation is explicit per page, not computed
  from a journey definition. Where the answer decides the next page, the redirect is a ternary
  on the validated answer and reads as the branch it is.
- **A zod schema whose messages are content keys**, not sentences: `.min(1, "firstNameRequired")`.
  `translateErrors` resolves the key against the page's `errors` map at render time, which is
  what keeps every string a citizen sees in the `.i18n.ts` file.
- **One private `render()`**, used by GET and by the POST failure path, so a page cannot
  render two different ways.
- **`export const GET = [requireRole("citizen"), getHandler]`** — middleware arrays. Only the
  start page, the gate pages and `/appeal/cannot-use-this-service` are open.
- **`.njk` basenames are globally unique.** Nunjucks resolves templates by basename across a
  flat search path, so two pages called `check-answers.njk` would collide.
- **Page content keys are merged over `res.locals`.** A key with the same name as one in
  `src/locales/en.ts` replaces it for that page.
- A content module may export **`en` as a function** of the view model where a string
  interpolates. A per-key function does not work — it lands in the template as a function.

The task list and check-your-answers are components over
[`src/libs/appeal/sections.ts`](src/libs/appeal/sections.ts) and
[`summary.ts`](src/libs/appeal/summary.ts), not pages that know the journey: adding a question
means one entry in that manifest, and both update. `applies` predicates keep the list honest —
WPAF1 branches on a representative, an appointee, still serving, and UK Special Forces, and
each opens a run of questions nobody else should be shown. `optional: true` tasks are excluded
from **both** halves of the "N of M sections" count, so the count can actually reach its total.

### The line the two repos have to agree on

[`src/libs/appeal/case-data.ts`](src/libs/appeal/case-data.ts) maps the draft onto CCD field
ids. A CCD field id is `<section prefix><CapitalisedProperty>` — `appFirstName` — because each
WPAF1 section is a `@JsonUnwrapped(prefix = …)` complex on `StWpaf1CaseData`:

| Prefix | Section | | Prefix | Section |
|---|---|---|---|---|
| `app` | appellant | | `rec` | AFCS reconsideration |
| `rep` | representative | | `time` | late-appeal explanation |
| `apt` | appointee | | `sup` | reasonable adjustments |
| `dsn` | the decision appealed against | | `uksf` | UK Special Forces |
| `rsn` | reasons for appealing | | `decl` | declaration |

`dsn` for the decision rather than `dec`, deliberately, so it cannot be misread next to
`decl`. The supporting-evidence table is the one exception: `SupportingEvidence` is a plain
CCD collection, not an unwrapped complex, so its sub-fields carry no prefix.

There is no lookup table of ids — every draft property is named for its Java counterpart, so
the id falls out of the name. Get one wrong and CCD rejects the **whole** submission, not the
field. `case-data.test.ts` pins every id this service produces against the case type's own
field list; regenerate that list with `./gradlew generateCCDConfig` in `sptribs-case-api` and
read `build/definitions/StWpaf1/CaseField.json`.

## Prototype-only shortcuts

These are deliberate, and they are the first things to change if this becomes a service.

- **The IDAM client is `sptribs-frontend`,** not one of its own. `idam-pr` registers each
  preview hostname as a redirect URI against it. A real service needs its own client.
- **The S2S microservice is `sptribs_case_api`,** not one of its own — it is already in the
  data store's `DATA_STORE_S2S_AUTHORISED_SERVICES`, so no platform onboarding was needed.
- **The Key Vault is the shared `sptribs-<env>`,** with `nodejs.aadIdentityName: sptribs`. A
  vault name cannot exceed 24 characters and `sptribs-wpaf1-prototype-aat` is far over.
- **`SESSION_SECRET` is a literal in `values.preview.template.yaml`.** It belongs in the Key
  Vault, created by a `random_password` in Terraform.
- **There is no `infrastructure/`.** Preview runs an in-chart Redis; AAT would use the
  existing `sptribs` Azure Cache for Redis, which needs a connection-string secret the vault
  does not yet hold.
- **No document upload.** The documents group captures the checklist and the evidence *table*;
  the documents themselves are emailed to the tribunal. Uploading means CDAM, virus scanning
  and a retention policy.
- **Master is not deployed.** The prototype lives on a PR so it deploys to Preview only —
  see below.

The absence of Welsh is **not** on that list. SEND is an England-only jurisdiction, so the
sibling's `cy = en` was correct scoping; WPAF1 claims England and Wales and rule 21(5)
expressly permits a notice of appeal in English or Welsh, so here it is a gap in the service
rather than a scope boundary. It is written up in
[`docs/service-design.md`](docs/service-design.md#welsh), with the Service Standard
self-assessment and the route to fixing it.

## Deploying to Preview

The repo is **public** and its Jenkins discovery topic is `jenkins-cft-j-z` — CFT splits the
org scan alphabetically, and without that topic Jenkins never sees the repo at all.
`@hmcts/special-tribunals` has write, `@hmcts/special-tribunals-admins` admin.

Two independent PRs land in the `sptribs` namespace and talk to each other over in-cluster
DNS:

1. A PR on `hmcts/sptribs-case-api` carrying the `StWpaf1` case type — currently
   [#2694](https://github.com/hmcts/sptribs-case-api/pull/2694).
2. A PR here, with `env.CASE_API_PR` in `Jenkinsfile_CNP` set to that number.

`values.preview.template.yaml` then points `CCD_URL` at
`http://sptribs-case-api-pr-<N>-ccd-data-store-api`. Jenkins sets `global.environment=aat`
for PR builds, so IDAM and S2S are the real AAT ones while CCD is the case-api PR's. A stale
`CASE_API_PR` deploys perfectly cleanly and then fails at the CCD submit, against a stack that
has never heard of this case type.

You need the HMCTS VPN to reach a preview URL.

The case-api chart's `global.idamApiUrl` must be `idam-api`, not `idam-web-public`, or the CCD
submit fails — ccd-data-store resolves the acting user with `GET /api/v1/users/{id}`, which
only idam-api routes.

## Licence

MIT — see [LICENSE](LICENSE).
