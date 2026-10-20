/**
 * Content for documents-checklist.
 *
 * The checklist printed beside WPAF1 question 1.1. Not sent to CCD: it is a prompt so the
 * appeal arrives with what the tribunal needs, and the tribunal records what actually
 * turned up. Only the decision letter is required, because that is the only document
 * every appeal must have.
 */
export const en = {
  title: "Which documents are you sending?",
  caption: "Documents and evidence",
  lede: "The tribunal needs the decision letter with your appeal. Tick what you are sending.",
  documentsLabel: "Which documents are you sending?",
  documentsHint: "Select all that apply.",
  documentsOptions: [
    { value: "decisionLetter", text: "A copy of the decision letter" },
    {
      value: "evidenceList",
      text: "A list of the additional evidence I am sending",
      hint: "List the documents so the tribunal can check everything arrived."
    }
  ],
  notLastChance:
    "This is not your last chance to send documents. Veterans UK will send the tribunal a response with the papers about your claim, and you will have a month to reply.",
  errors: {
    documentsDecisionLetterRequired: "You must send a copy of the decision letter"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
