# Service design: appealing a war pension or armed forces compensation decision

What this prototype is trying to be, what it deliberately is not, and every place where it
departs from the paper form and why.

The legal and business rules this journey implements are written up separately, in the
workspace at
[`apps/sptribs/docs/explanation/wpaf1-appeal-business-rules.md`](../../docs/explanation/wpaf1-appeal-business-rules.md).
This document is about the design decisions taken on top of them.

## The problem

A veteran who has been refused a war pension, or given an assessment they think is too low,
has twelve months to appeal. What they have in front of them today is **WPAF1**: a 13-page PDF
with eight numbered sections, "Go to Section 3 or 4" arrows, three different tribunals'
addresses printed on the back page, and two privacy notices. They fill it in, sign it, and
email or post it to whichever of those three addresses is theirs.

The people using it are usually appealing about an injury or an illness, often one they have
had for years and sometimes one they acquired decades ago. Many are not well. Many are using a
veterans' charity caseworker as a representative, and some have an appointee acting because
they cannot act for themselves. Almost none are lawyers.

The form is also doing something the paper cannot do well: deciding, before anything else
happens, whether there is an admissible appeal at all. Which nation, which scheme, how old the
decision is, and whether a reconsideration has been asked for are four questions whose answers
change what the form even means. On paper they are printed as prose and left to the appellant.

## Users and what they need

| User | Need | How the service meets it |
|---|---|---|
| A veteran appealing their own decision | To know whether they can appeal at all, and by when | The compliance gate establishes nation, scheme and decision age before asking for a single personal detail |
| Somebody in Scotland or Northern Ireland | To find out early that this is the wrong tribunal | Asked first. A dead-end page naming PAT Scotland or PAT NI, with their details and the PDF |
| Somebody who does not know which scheme they are on | Not to have to guess | Asked as a date-of-service question, with an "I'm not sure" branch into help text rather than a validation error |
| Somebody appealing late | To be able to appeal anyway | The reasons question appears when the dates say so; a judge decides admissibility, not this service |
| Somebody past the two-year bar | To be told the truth, and still be heard | Warned plainly that the Tribunal cannot extend it, reasons collected, appeal still submittable |
| A representative acting for an appellant | To act without pretending to be the appellant | Separate representative section; the declaration switches to its third-person variant |
| An appointee | To sign lawfully on somebody's behalf | The signing ground — under 16, or infirmity — is captured, because it is what makes the signature valid |
| Anybody part-way through | To stop, find the decision letter, and come back | Task list hub; the draft is in the session and survives a restart |
| A caseworker | To read the whole appeal | Nine tabs in XUI, every answer shown |

These are inferred from the form, the 2008 Rules and the published guidance, not from research.
**No user research has been done.** That is the single largest gap in this prototype. The
questions below marked "assumption" are the ones most likely to be wrong.

## The journey

```
/                                   start page — what you can appeal, who can, when by
  ↓ Start now
/appeal/where-do-you-live           England · Wales · Scotland · Northern Ireland
  ↓ Scotland / NI
/appeal/cannot-use-this-service     PAT Scotland or PAT NI details + the WPAF1 PDF. No case created.
  ↓ England / Wales
/appeal/which-scheme                service before 6 Apr 2005 · on or after · I'm not sure
/appeal/decision-date               the date on the decision letter
  ↓  ≤ 12 months                    straight on
  ↓  12–24 months                   /appeal/appeal-is-late       — reasons (Section 7)
  ↓  > 24 months                    /appeal/appeal-is-very-late  — the bar explained, reasons still taken
/appeal/reconsideration             AFCS only (Section 6)
/appeal/decision-letter-check       confirm they have a copy of the decision letter
  ↓ (sign in)
/appeal/task-list                   the hub — groups mirroring the form's sections
  ↓
  question pages                    one thing per page
  ↓
/appeal/check-answers               every answer, with a Change link that says what it changes
/appeal/declaration                 who is signing, the statement of truth, full name, date
/appeal/confirmation                the reference, and the 14-day registration note
```

Sign-in sits between the compliance gate and the task list, for the same reason it does in
SEND35: somebody has to be able to find out whether this service is theirs before being asked
to create an account, and the gate's answers are cheap to re-ask.

### The compliance gate, and why it is linear

The gate is four questions and it runs before the hub, as a fixed sequence, not as hub tasks.

The reason is that these four answers are not pieces of the appeal — they decide whether there
is an appeal. Nation decides whether this tribunal has jurisdiction at all. Scheme decides
whether Section 6 exists. The decision date decides whether the appeal is in time, late, or
past the two-year bar under rule 21(4), and therefore whether reasons for lateness are a
required input to somebody else's decision. Reconsideration decides whether the tribunal has
to refer the form to Veterans UK before anything else happens.

A task list is the wrong shape for that. A hub says "answer these in any order, we'll tell you
when you're done"; a gate says "until I know this, I don't know what to ask you next". Putting
the late-appeal reasons in the hub in particular would mis-model rule 21(2): those reasons are
what the decision maker reads when deciding whether to object within their 28 days, which is
not the same kind of thing as a phone number.

HMCTS has solved this exact shape before. `apps/sscs/sscs-submit-your-appeal` appeals a benefit
decision, with a mandatory reconsideration notice, a short time limit, a late window and an
outer bar — structurally identical, with 1 month and 13 months where WPAF1 has 12 and 24. Its
`steps/compliance/` tree is the pattern:

```
steps/compliance/have-a-mrn/                      do you have the reconsideration notice
steps/compliance/no-mrn/                          off-ramp
steps/compliance/mrn-date/                        date of the notice; branches on its age
steps/compliance/mrn-over-month-late/             late: collect reasons
steps/compliance/mrn-over-thirteen-months-late/   past the outer bar: still collect reasons
steps/exit-points/exit/                           cannot-use-this-service
```

Two things carry over. The gate runs before the main journey, linearly. And past its own outer
bar SSCS still collects reasons and routes straight on into the rest of the journey — read
`MRNOverThirteenMonthsLate.js` and its `next()` goes to the next real question, not to a dead
end. It warns; it does not block. WPAF1 behaves the same way at 24 months. HMCTS's own
precedent is that a web form does not get to decide an appeal is inadmissible.

The code itself is not reusable: SSCS is built on `@hmcts/one-per-page`, a different generation
of framework from this repo's page-per-directory convention.

### The Scotland and Northern Ireland off-ramp

`/appeal/cannot-use-this-service` is a dead end, and deliberately a complete one: it names the correct
tribunal, gives its address and contact details, and links the WPAF1 PDF so the appellant can
do today what they would have done anyway.

**No case is created on that path.** Not a draft, not a shell, nothing. The WPAFCC has no
power to hear a Scottish or Northern Irish appeal, and a case sitting in an England-and-Wales
case store is worse than no case: it looks to a caseworker like an appeal they can progress.
The off-ramp is also where a different data controller takes over — PAT Scotland and PAT NI
have their own privacy notices — so it is a handover, not a redirect.

### Why a task list rather than one long form

1. **It is eight sections with real branching.** Sections 2 and 3 are each entirely skipped by
   most appellants, and the form says so with arrows. A task list can remove them; a linear
   form has to either ask or jump silently.
2. **The decision letter has to be found.** Somebody will start, realise the letter is in a
   drawer upstairs or at their representative's office, and come back.
3. **The UKSF question is sensitive and conditional.** It needs to appear for the people it
   applies to and be invisible to everyone else.

Tasks that do not apply are **removed**, not greyed out. Showing somebody a task they must not
answer is worse than not showing it.

Optional tasks are excluded from both halves of the "N of M sections" count, so the count can
actually reach its total.

## Deliberate departures from WPAF1

Each of these is a choice, not an omission.

| WPAF1 | Here | Why |
|---|---|---|
| "Go to Section 3 or 4" arrows | Routing in each page's POST, and a hub that recomputes which tasks apply | The arrows are branch logic printed on paper. Making them real is most of the value of doing this digitally. |
| The appellant infers their own scheme from the 6 April 2005 rule, then meets a Section 6 question that only applies to one scheme | Asked directly, as a question about when they served | An appellant knows when they served. They do not necessarily know that the scheme names changed in 2005, and they should not have to to answer a question correctly. |
| No field for the decision's reference | National Insurance number is required, not optional | Rule 21(5) requires the notice to state the decision's full reference. The form has no such field, so the NI number and AFCS Member number are what identify the decision in practice. Making NI optional would drop a rule 21(5) requirement. |
| Three tribunals' addresses on the back page | A jurisdiction question, first, with an off-ramp | A service that submits the appeal cannot leave the choice of tribunal to the appellant. |
| Section 7 late-appeal box, filled in or not at the appellant's discretion | A page reached only when the dates say so, with the reasons required there | On paper nobody knows whether their appeal is late. The service can work it out and ask only when it matters — and then it matters a lot. |
| Section 6 printed for everybody, annotated "AFCS claims only" | Reachable only when the scheme is AFCS | A War Pension appellant should never see a reconsideration question. |
| A confirmation checkbox about the UKSF Disclosure Cell, shown to everyone | "Have you served with UK Special Forces?", then the confirmation if yes | An unexplained checkbox about a Disclosure Cell is noise to almost every appellant and easy to tick past for the ones it binds. |
| Signature box | A typed full name | The form already accepts a typed name, and there is no wet-ink step in an emailed PDF either. |
| Documents attached to the form | A checklist and an evidence list, then email them | Upload means CDAM, virus scanning and a retention policy. Out of scope for a prototype, and the tribunal accepts email today. |
| One long page per section | One thing per page | The GOV.UK Design System. Multi-input pages only where it sanctions them: a name, an address, a set of contact details. |
| Guidance in the margins and on the cover page | Hint text under the question, `<details>` for the longer notes | A guidance column beside the question does not exist on a phone, and the guidance is the part people most need. |
| Statement of truth with first-person and third-person variants printed side by side | The variant matching who is signing | Which one applies is not cosmetic — it is what the person is attesting to. |
| "Appointee" and "Representative" as two similar-looking sections | Two sections, and the appointee's **signing ground** captured | An appointee may sign only where the appellant is under 16 or cannot sign through mental or physical infirmity. The ground is what makes the signature valid, and the form never asks for it. |

### Welsh

**None.** Unlike SEND35, this service claims the England and Wales jurisdiction, and rule
21(5) of the 2008 Rules permits a notice of appeal in English or Welsh. Welsh content is
therefore required before this could serve Wales, and it is not done. `cy` is exported as `en`
throughout and the language toggle is not offered. The route other CFT services used is the
Welsh Language Translation Service; PCS, Probate and PRL each ran their own uploads.

The locale plumbing itself stays, because it comes with the starter and removing it would make
this repo diverge from every other CFT frontend for no gain.

This is the one place the prototype is knowingly short of the **quality** bar rather than short
of fidelity, which is why it is here and in the Service Standard self-assessment rather than in
the list of accepted shortcuts below. SEND35's absence of Welsh is a correct scoping decision
for an England-only jurisdiction. This one is a gap.

## Fidelity is not quality

The service this prototype is part of accepts lower initial *fidelity* — less is understood and
specified up front — without accepting lower *quality*. Concretely, in this repo:

**Held to the bar:**

- Every page is checked against WCAG 2.2 AA by axe, in CI, on every run. Zero violations.
- Error messages follow the GOV.UK content pattern, the summary links move focus to the field,
  and the page title is prefixed on error.
- Nothing is written to CCD until the declaration is signed, so an abandoned appeal leaves no
  case behind — and nothing at all is written on the Scotland/NI path.
- The three time-limit branches are walked explicitly in test with dates either side of each
  boundary, because a wrong boundary is the one bug here that silently costs somebody their
  appeal.
- CSRF on every form; the session cookie is signed with a real secret; the case reference is
  never in a URL.
- The one place the frontend and the case type have to agree — the CCD field ids — is pinned by
  a test rather than by care. One wrong id and CCD rejects the whole submission, not the field.

**Accepted as lower fidelity, to be found out by use:**

- No user research, so the question wording and grouping are best guesses from the form.
- No document upload. The evidence list and the decision-letter checklist are captured; the
  files are emailed, as they are today.
- No "save and come back later" email or reference — the draft is the session, so it is lost if
  somebody clears their cookies.
- Nothing models rule 22. An appellant whose decision is revised after lodging has 42 days to
  respond or the appeal lapses, and this service does not tell them that because it ends at the
  confirmation page.
- No performance measurement, no analytics beyond the cookie banner's placeholder.
- The service is not shuttered, monitored or alerted; it is a prototype, deployed from a PR to
  Preview only.

## Service Standard

Where this prototype stands against the 14 points, honestly.

| Point | Where it stands |
|---|---|
| 1. Understand users and their needs | **Weakest.** Needs inferred from WPAF1, the 2008 Rules and the GOV.UK guidance; no research. Veterans, appointees and charity representatives are three distinct user groups and none has been spoken to. |
| 2. Solve a whole problem | Partly. The appeal is lodged end to end, but documents still go by email and there is no way to track the appeal or respond to a revised decision afterwards. |
| 3. Joined up across channels | The paper form and the three email addresses are still there and are signposted, including on the Scotland/NI off-ramp, but nothing is shared between them. |
| 4. Simple to use | Compliance gate, task list, one thing per page, branching that removes what does not apply, guidance where the question is. |
| 5. Everyone can use it | Design System components throughout; axe checks every page in CI. No assistive-technology testing, no audit. **No Welsh** — see above. |
| 6. Multidisciplinary team | Out of scope for a prototype. |
| 7. Agile ways of working | — |
| 8. Iterate and improve | The point of the prototype. |
| 9. Secure and protects privacy | CSRF, signed sessions, no case reference in a URL, no case created until submission, no case at all on the off-ramp path, no upstream error bodies rendered. Not penetration tested. |
| 10. Define success, publish performance | Not done. |
| 11. Right tools and technology | The CFT Node/Express starter, govuk-frontend, CCD — the same stack as every other service on this platform, and the same as the SEND35 sibling. |
| 12. Make new source code open | Public repo, MIT. |
| 13. Open standards and common components | GOV.UK Design System components only; no bespoke form controls. IDAM, S2S and CCD rather than anything of its own. |
| 14. Operate a reliable service | Not attempted. Preview only; master is not deployed. |

## What to do next

In the order it would pay off:

1. **Welsh.** It is the only item here that is a defect rather than a scope boundary. Route it
   through the Welsh Language Translation Service.
2. **Research the journey** with veterans, appointees and charity representatives. Everything
   marked "assumption" above, and in particular the scheme question — the 6 April 2005
   boundary is the one place an appellant can give a confidently wrong answer.
3. **Ask for the decision reference.** Rule 21(5) requires it and the paper form's omission is
   not a good reason for a digital service to repeat it. Worth checking with Veterans UK what
   reference they would actually want.
4. **Save and come back later properly** — a reference and a resume link, not just a session.
   The decision letter is often not to hand, so this journey is abandoned mid-way more than
   most.
5. **Documents.** Upload through CDAM, so the appeal arrives complete and the UKSF disclosure
   obligation can be enforced at the point of upload rather than by a checkbox.
6. **Model rule 22.** Tell an appellant whose decision is revised that they have 42 days, and
   give them a way to respond. Losing an appeal by silence is the worst outcome this domain
   contains.
7. **Content review** by a content designer. The wording here is the tribunal's own where it
   exists and mine where it does not, which is not the same as good.
