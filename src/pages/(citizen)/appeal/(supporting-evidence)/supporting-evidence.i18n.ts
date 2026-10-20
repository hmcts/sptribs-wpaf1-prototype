/**
 * Content for supporting-evidence.
 *
 * WPAF1 asks for a list of the additional evidence being sent, as an add-another loop.
 * The examples carry more weight than they look: "a consultant's report" and
 * "Dr M. Smith, Consultant Rheumatologist" tell somebody what level of detail is wanted
 * far better than any instruction.
 */
export const en = {
  title: "Tell the tribunal about your evidence",
  caption: "Documents and evidence",
  lede: "You can add evidence to support your appeal, such as medical reports, letters and records of your service.",
  optional:
    "This is optional, and it is not your last chance to send documents. Veterans UK will send the tribunal a response with the papers about your claim, and you will have a month to reply.",
  addedHeading: "Evidence you have added",
  noneAdded: "You have not added any evidence yet.",
  addHeading: "Add a piece of evidence",
  evidenceDescriptionLabel: "What is the evidence?",
  evidenceDescriptionHint: "For example, a consultant's report.",
  signedByLabel: "Who signed or wrote it? (optional)",
  signedByHint: "For example, Dr M. Smith, Consultant Rheumatologist.",
  documentDateLabel: "Date on the document (optional)",
  documentDateHint: "For example, 21 1 2026",
  pageCountLabel: "How many pages? (optional)",
  addAnother: "Add this evidence",
  remove: "Remove",
  continueText: "Continue",
  errors: {
    evidenceDescriptionRequired: "Enter what the evidence is",
    evidenceDescriptionTooLong: "What the evidence is must be 500 characters or fewer",
    signedByTooLong: "Who signed or wrote it must be 255 characters or fewer",
    pageCountTooLong: "Number of pages must be 10 characters or fewer",
    documentDateInvalid: "The date on the document must be a real date"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
