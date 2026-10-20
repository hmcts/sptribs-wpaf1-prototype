/**
 * Content for date-of-birth.
 *
 * WPAF1 question 1.1. The tribunal uses it with the National Insurance number to match
 * the appeal to the right claim, and an appointee may only sign for an appellant who is
 * under 16 — so it is a fact the declaration depends on, not demographics.
 */
export const en = {
  title: "What is the appellant's date of birth?",
  caption: "About the appellant",
  dateOfBirthLabel: "What is the appellant's date of birth?",
  dateOfBirthHint: "For example, 27 3 1972",
  errors: {
    dateOfBirthRequired: "Enter the appellant's date of birth",
    dateOfBirthInvalid: "The appellant's date of birth must be a real date"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
