/**
 * Content for support-details.
 *
 * WPAF1 question 8.1's "give details". Reached only from a "Yes", and not a task of its
 * own — the hub tracks the question, and asking the citizen to tick off the consequence
 * of their own answer separately would make the list longer without making it clearer.
 */
export const en = {
  title: "What support is needed?",
  caption: "Support during your appeal",
  supportDetailsLabel: "What support is needed?",
  supportDetailsHint: "Say who needs it and what they need. If it is for somebody coming with you, say who they are.",
  errors: {
    supportDetailsRequired: "Describe the support that is needed",
    supportDetailsTooLong: "The support needed must be 5,000 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
