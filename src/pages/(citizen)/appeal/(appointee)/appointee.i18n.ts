/**
 * Content for appointee.
 *
 * WPAF1 question 3.1. An appointee is not the same as a representative and the paper form
 * does not explain the difference, so the page does: a representative acts for somebody
 * who can act for themselves, an appointee acts for somebody who cannot. The grounds
 * matter because they are the only two on which an appointee may sign the appeal, and the
 * declaration asks which one applies.
 */
export const en = {
  title: "Does the appellant have an appointee?",
  caption: "The appellant's appointee",
  hasAppointeeLabel: "Does the appellant have an appointee?",
  hasAppointeeHint: "An appointee acts for an appellant who cannot act for themselves. This is not the same as a representative.",
  detailsSummary: "When somebody has an appointee",
  detailsText:
    "An appointee can only sign this appeal for the appellant if the appellant is under 16, or cannot sign because of mental or physical infirmity. Appointees are usually appointed by Veterans UK or the Department for Work and Pensions.",
  errors: {
    hasAppointeeRequired: "Select yes if the appellant has an appointee"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
