/**
 * Content for decision-letter-check.
 *
 * The first item on WPAF1's own checklist, asked as a question. The tribunal cannot
 * register an appeal without the decision it is against, and finding that out at the end
 * — after the whole form — is the worst possible moment.
 */
export const en = {
  title: "Do you have a copy of the decision letter?",
  caption: "Before you start",
  hasDecisionLetterLabel: "Do you have a copy of the decision letter?",
  hasDecisionLetterHint: "This is the letter from Veterans UK about the decision you disagree with. You need to send a copy with your appeal.",
  whyNote: "The tribunal needs the decision letter to register your appeal, because it is the only place the decision's full reference appears.",
  errors: {
    hasDecisionLetterRequired: "Select yes if you have a copy of the decision letter"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
