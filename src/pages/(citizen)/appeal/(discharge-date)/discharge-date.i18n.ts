/**
 * Content for discharge-date.
 *
 * WPAF1 question 1.4's "if known". Asked only of somebody still serving, and left
 * genuinely optional — a date nobody has been given yet cannot be supplied, and the
 * tribunal wants it for listing rather than for admissibility.
 */
export const en = {
  title: "When is the appellant due to be discharged?",
  caption: "About the appellant",
  proposedDischargeDateLabel: "When is the appellant due to be discharged?",
  proposedDischargeDateHint: "If you do not know, leave this blank. For example, 30 9 2026",
  errors: {
    proposedDischargeDateInvalid: "The proposed discharge date must be a real date"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
