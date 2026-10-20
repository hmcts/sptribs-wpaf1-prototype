/**
 * Content for reconsideration.
 *
 * WPAF1 Section 6, which the paper form marks "AFCS claims only". The explanation of what
 * happens when the answer is No is on the page for both answers rather than behind the
 * No: it is what the tribunal will do next, and somebody deciding how to answer is
 * entitled to know that before they choose rather than after.
 */
export const en = {
  title: "Have you asked for a Reconsideration?",
  caption: "The decision you are appealing",
  askedForReconsiderationLabel: "Have you asked the Secretary of State to look at the decision again?",
  askedForReconsiderationHint: "This is called a Reconsideration. It applies to Armed Forces Compensation Scheme decisions.",
  referralNote:
    "If you have not asked for a Reconsideration, the tribunal must send your form to Defence Business Services (Veterans UK) to reconsider the decision first. This is a legal requirement and it does not stop your appeal.",
  errors: {
    askedForReconsiderationRequired: "Select yes if you have asked for a Reconsideration"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
