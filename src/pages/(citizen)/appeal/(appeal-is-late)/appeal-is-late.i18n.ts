/**
 * Content for appeal-is-late.
 *
 * WPAF1 Section 7, shown when the decision letter is between 12 and 24 months old. The
 * page says what rule 21(3) actually means — that the appeal goes ahead unless the
 * decision maker objects — because "your appeal is late" on its own reads as a refusal.
 */
export const en = {
  title: "Your appeal is late",
  caption: "The decision you are appealing",
  heading: "Your appeal is late",
  lede: "The date on the decision letter is more than 12 months ago, so your appeal is outside the usual time limit.",
  whatHappens: [
    "You can still appeal. You need to tell the tribunal why your appeal is late.",
    "Veterans UK has 28 days to object to a late appeal. If it does not object, your appeal is treated as if it had been made in time.",
    "If it does object, a tribunal judge decides whether your appeal can go ahead."
  ],
  lateAppealExplanationLabel: "Why is your appeal late?",
  lateAppealExplanationHint:
    "Give the full reasons for the delay — for example illness, a change of address, waiting for medical records, or not being told about the time limit.",
  errors: {
    lateAppealExplanationRequired: "Explain why your appeal is late",
    lateAppealExplanationTooLong: "Your explanation must be 5,000 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
