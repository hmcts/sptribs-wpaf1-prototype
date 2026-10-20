/**
 * Content for what-you-are-appealing.
 *
 * WPAF1 question 4.2, "choose all that apply". The five grounds are the statutory appeal
 * categories under the Pensions Appeal Tribunals Act 1943 — entitlement under sections 1
 * to 3, assessment under section 5, and the rest under section 5A — so the wording is the
 * form's rather than a paraphrase. "Something else" takes free text, because section 5A
 * is open-ended and the tribunal would rather read the appellant's own description than
 * guess from a tick.
 */
export const en = {
  title: "What are you appealing about?",
  caption: "The decision you are appealing",
  appealAboutLabel: "What are you appealing about?",
  appealAboutHint: "Select all that apply. The decision letter explains what was decided.",
  appealAboutOptions: [
    {
      value: "entitlement",
      text: "The refusal of an award, or the level of entitlement"
    },
    {
      value: "awardLevel",
      text: "The level of an award — the percentage assessment, or the rate of allowance or tariff level",
      hint: "Choose this if an award was made but it is less than the maximum or the highest tariff level."
    },
    {
      value: "awardStartDate",
      text: "The date an award starts"
    },
    {
      value: "awardChanges",
      text: "Changes to the amount or duration of an award"
    },
    {
      value: "label",
      text: "The label — the medical name given for a claimed condition"
    },
    {
      value: "other",
      text: "Something else"
    }
  ],
  appealAboutOtherLabel: "What else are you appealing about?",
  errors: {
    appealAboutRequired: "Select what you are appealing about",
    appealAboutOtherRequired: "Tell the tribunal what else you are appealing about",
    appealAboutOtherTooLong: "What else you are appealing about must be 2,000 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
