/**
 * Start page content, from WPAF1's cover pages and the GOV.UK guide "War Pension or Armed
 * Forces Compensation appeal".
 *
 * Wording is the tribunal's own wherever it exists. The 12-month limit is rule 21(1) and
 * the 2-year bar is rule 21(4); both are on this page rather than discovered part way
 * through, because for a decision made years ago they are the whole answer.
 */
export const en = {
  title: "Appeal a War Pension or Armed Forces Compensation Scheme decision",
  heading: "Appeal a War Pension or Armed Forces Compensation Scheme decision",
  useThisService:
    "Use this service to appeal a Veterans UK decision about a War Pension or an Armed Forces Compensation Scheme (AFCS) award, to the First-tier Tribunal (War Pensions and Armed Forces Compensation Chamber).",
  whatYouCanAppealHeading: "What you can appeal",
  whatYouCanAppealIntro: "You can appeal against:",
  whatYouCanAppeal: [
    "the refusal of an award, or the level of entitlement",
    "the level of an award — the percentage assessment, or the rate of allowance or tariff level",
    "the date an award starts",
    "changes to the amount or duration of an award",
    "the label, which is the medical name given for a claimed condition"
  ],
  schemesHeading: "The two schemes",
  schemes:
    "The War Pensions Scheme covers an injury or illness caused or made worse by service before 6 April 2005. The Armed Forces Compensation Scheme covers an injury or illness caused by service on or after 6 April 2005.",
  whereYouLiveHeading: "Where you live",
  whereYouLive:
    "This service covers England and Wales. Appeals from Scotland go to the Pensions Appeal Tribunal for Scotland, and appeals from Northern Ireland go to the Pensions Appeal Tribunal for Northern Ireland, through Veterans UK.",
  deadlineHeading: "When to appeal",
  deadline: "You must appeal within 12 months of the date on the decision letter.",
  deadlineLate:
    "If it is longer than 12 months you can still appeal. You will be asked to explain why your appeal is late. Veterans UK has 28 days to object, and if it does not object your appeal is treated as if it had been made in time.",
  deadlineBar:
    "After 2 years the tribunal cannot accept an appeal against that decision. No judge can extend that limit. You can ask Veterans UK to look at the decision again or make a new claim instead.",
  reconsiderationHeading: "Reconsideration",
  reconsideration:
    "For an Armed Forces Compensation Scheme decision you can ask the Secretary of State to look at the decision again before you appeal. This is called a Reconsideration. If you have not asked for one, the tribunal must send your form to Veterans UK to reconsider the decision first — it does not stop your appeal.",
  beforeYouStartHeading: "Before you start",
  youWillNeedIntro: "You will need:",
  youWillNeed: [
    "the decision letter from Veterans UK, and the date on it",
    "the appellant's National Insurance number",
    "the AFCS member number, if the appeal is about an AFCS decision and you know it",
    "contact details for the appellant, and for any representative or appointee",
    "your reasons for disagreeing with the decision"
  ],
  documents:
    "You can add supporting evidence such as medical reports and letters. This is not your last chance to send documents — Veterans UK will send you the claim papers after your appeal is lodged, and you will have a month to reply.",
  uksf: "If you have served with UK Special Forces, take advice from the UKSF Disclosure Cell before you send any documents.",
  saveProgress: "You can save your answers and come back later.",
  startButton: "Start now",
  helpHeading: "If you need help",
  help: "Contact the tribunal if you need help with your appeal or with how the tribunal works. The tribunal cannot give legal advice."
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
