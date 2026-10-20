/**
 * Content for support.
 *
 * WPAF1 question 8.1. The paper form asks about support "during your appeal", and the
 * body text keeps that scope: the letters and phone calls are most of the appellant's
 * contact with the tribunal, and somebody who reads the question as being about the
 * hearing only will say no and then struggle with everything before it.
 */
export const en = {
  title: "Does anyone need additional support during the appeal?",
  caption: "Support during your appeal",
  heading: "Does anyone need additional support during the appeal?",
  body: [
    "You can ask for support if you, or anyone coming with you, has a health condition, a disability, or another reason for needing it. Some kinds of support have to be agreed by the tribunal.",
    "Think about everything you might need, not only at a hearing — the tribunal's letters and phone calls count too. You can tell the tribunal if what you need changes."
  ],
  needsSupportLabel: "Does anyone need additional support during the appeal?",
  detailsSummary: "Examples of additional support",
  detailsText:
    "A sign language interpreter. A hearing loop. Documents in large print, braille, or a different colour. A step-free route and accessible parking. Extra breaks, or a seat near the front. Help from somebody who supports you day to day.",
  errors: {
    needsSupportRequired: "Select yes if anyone needs additional support during the appeal"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
