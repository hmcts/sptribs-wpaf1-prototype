/**
 * Content for representative-reference.
 *
 * WPAF1 questions 2.4 and 2.5, both "if you have one" on the paper form and both left
 * optional here. A DX number and a case reference are things a firm of solicitors has and
 * a relative acting for the appellant does not, so the page says plainly that it can be
 * skipped — the task list shows it as optional for the same reason.
 */
export const en = {
  title: "Does the representative have a DX number or a reference number?",
  caption: "The appellant's representative",
  heading: "Does the representative have a DX number or a reference number?",
  lede: "You can leave both blank. Most representatives who are not solicitors do not have either.",
  dxNumberLabel: "DX number (optional)",
  dxNumberHint: "A document exchange address, used instead of a postal address. For example, DX 123456 LONDON.",
  referenceNumberLabel: "Reference number (optional)",
  referenceNumberHint: "The representative's own reference for this case, so they can match the tribunal's letters to their file.",
  errors: {
    dxNumberTooLong: "DX number must be 50 characters or fewer",
    referenceNumberTooLong: "Reference number must be 50 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
