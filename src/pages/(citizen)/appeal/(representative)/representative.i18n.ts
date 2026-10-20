/**
 * Content for representative.
 *
 * WPAF1 question 2.1. Three things about representation are easy to miss on the paper
 * form and all three change the decision, so they are on the page rather than in a
 * guidance note: a representative does not have to be a lawyer, the appellant pays any
 * lawyer they do appoint, and naming a representative and signing the form authorises
 * both the tribunal and Veterans UK to discuss the case with them.
 */
export const en = {
  title: "Does the appellant have a representative?",
  caption: "The appellant's representative",
  hasRepresentativeLabel: "Does the appellant have a representative?",
  hasRepresentativeHint: "A representative deals with the tribunal on the appellant's behalf. They must have agreed to act before you name them.",
  detailsSummary: "Who can be a representative",
  detailsText:
    "A representative does not need to be legally qualified. A friend, a relative, or an adviser from a charity such as the Royal British Legion, Veterans UK welfare service or Citizens Advice can act. If you appoint a solicitor or barrister, the appellant pays their fees.",
  authorisationNote:
    "Naming a representative and signing this appeal allows the tribunal and Veterans UK to discuss the case with them, and to send them papers about it.",
  errors: {
    hasRepresentativeRequired: "Select yes if the appellant has a representative"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
