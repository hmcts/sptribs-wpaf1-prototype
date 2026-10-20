/**
 * Content for decision-date.
 *
 * WPAF1 question 4.1. The 12-month limit in rule 21(1) runs from the date the written
 * notice of the decision was sent, which the form expresses as the date on the letter —
 * so the hint says 12 months rather than leaving the limit on the start page only.
 */
export const en = {
  title: "What is the date on the decision letter?",
  caption: "The decision you are appealing",
  decisionLetterDateLabel: "What is the date on the decision letter?",
  decisionLetterDateHint: "This is the letter from Veterans UK about the decision you disagree with. For example, 27 3 2026",
  deadlineNote:
    "You must usually appeal within 12 months of this date. If it is longer than that you can still appeal, and you will be asked to explain why it is late.",
  errors: {
    decisionLetterDateRequired: "Enter the date on the decision letter",
    decisionLetterDateInvalid: "The date on the decision letter must be a real date"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
