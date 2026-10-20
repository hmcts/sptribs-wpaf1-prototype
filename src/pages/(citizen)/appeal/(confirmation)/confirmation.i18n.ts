/**
 * Content for the confirmation page.
 *
 * The "what happens next" content is WPAF1's own last page and the GOV.UK guide: a letter
 * confirming registration within 14 days, Veterans UK's response with the claim papers,
 * one month to reply to it, and a hearing before a judge, a medical member and a service
 * member. Those timings are what stop people ringing on day three, so they are on the
 * page rather than in an email nobody keeps.
 *
 * Exported as a function so the panel can carry the reference — see task-list.i18n.ts for
 * why a per-key function does not work.
 */
export const en = (params: { reference?: string }) => ({
  title: "Appeal sent",
  panelTitle: "Appeal sent",
  panelHtml: `Your appeal reference<br><strong>${params.reference ?? ""}</strong>`,
  keepReference: "Keep a note of your appeal reference. You will need it if you contact the tribunal.",
  whatNextHeading: "What happens next",
  whatNext: [
    "The tribunal will write to you to confirm your case is registered. If you have not received confirmation within 14 days, contact the tribunal.",
    "Veterans UK will then send the tribunal a response with the papers about your claim, and send you a copy. You will have one month to reply in writing if you want to.",
    "A hearing is usually held within 4 months of that response, and you will get at least 14 days' notice of it. Your appeal is decided by a judge, a medical member and a service member."
  ],
  documentsHeading: "Sending your documents",
  documents: [
    "Email the decision letter, and any supporting evidence you listed, to the tribunal. Put your appeal reference in the subject line.",
    "This is not your last chance to send documents. You can send more once you have seen Veterans UK's response."
  ],
  feedbackHeading: "What did you think of this service?",
  // Not `feedback`: that name is already an object in src/locales/en.ts, used by the phase
  // banner. A page key of the same name shadows it, and because String.prototype.link is a
  // legacy method the banner's href silently became a function's source and its link lost
  // its text — a serious accessibility failure from a name clash.
  feedbackPrompt: "Your feedback helps us improve it."
});

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
