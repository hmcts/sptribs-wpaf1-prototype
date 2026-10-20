/**
 * Content for which-scheme.
 *
 * WPAF1 does not ask this, because a paper form does not have to route anything — the
 * appellant knows which letter they are holding. This service does: Section 6 is an AFCS
 * question, so a War Pensions appellant must never be shown it.
 *
 * The 6 April 2005 date is the scheme boundary, and it is the only thing most people need
 * to work out which is theirs, so it is in the option text rather than hidden in guidance.
 */
export const en = {
  title: "Which scheme was the decision made under?",
  caption: "Before you start",
  schemeLabel: "Which scheme was the decision made under?",
  schemeOptions: [
    {
      value: "warPension",
      text: "War Pensions Scheme",
      hint: "For an injury or illness caused or made worse by service before 6 April 2005."
    },
    {
      value: "afcs",
      text: "Armed Forces Compensation Scheme (AFCS)",
      hint: "For an injury or illness caused by service on or after 6 April 2005."
    },
    { value: "notSure", text: "I am not sure" }
  ],
  notSureNotice: "Read the guidance below, then choose the scheme that applies. If you are still not sure, contact the tribunal before you go on.",
  helpSummary: "How to tell which scheme applies",
  helpBody: [
    "The scheme depends on when the service that caused the injury or illness happened, not on when you claimed or when the decision was made.",
    "If the service was before 6 April 2005, it is the War Pensions Scheme. If it was on or after 6 April 2005, it is the Armed Forces Compensation Scheme.",
    "Your decision letter from Veterans UK says which scheme it is about. If you have an AFCS member number, the decision is almost certainly an AFCS one."
  ],
  errors: {
    schemeRequired: "Select which scheme the decision was made under"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
