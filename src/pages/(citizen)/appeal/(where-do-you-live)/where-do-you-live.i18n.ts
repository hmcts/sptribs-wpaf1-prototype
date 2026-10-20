/**
 * Content for where-do-you-live.
 *
 * Not a WPAF1 question. The paper form states the three jurisdictions on its cover and
 * leaves the appellant to pick the right address to post to; a digital service has to
 * know before it can route anything, and asking turns a cover note into a check.
 */
export const en = {
  title: "Where does the appellant live?",
  caption: "Before you start",
  livesInLabel: "Where does the appellant live?",
  livesInHint: "Appeals in England and Wales are decided by the First-tier Tribunal (War Pensions and Armed Forces Compensation Chamber).",
  livesInOptions: [
    { value: "england", text: "England" },
    { value: "wales", text: "Wales" },
    { value: "scotland", text: "Scotland" },
    { value: "northernIreland", text: "Northern Ireland" }
  ],
  errors: {
    livesInRequired: "Select where the appellant lives"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
