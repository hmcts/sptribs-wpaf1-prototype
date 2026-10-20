/**
 * Content for reference-numbers.
 *
 * WPAF1 question 1.1, where both numbers read as optional. The National Insurance number
 * is required here instead, and the lede says why: rule 21(5) requires the notice of
 * appeal to give details of the decision including its full reference, the paper form has
 * no decision-reference field, and the National Insurance number is what Veterans UK
 * matches an appeal to a claim on. The AFCS member number is genuinely "if known".
 */
export const en = {
  title: "What are the appellant's reference numbers?",
  caption: "About the appellant",
  heading: "What are the appellant's reference numbers?",
  lede: "The tribunal and Veterans UK use these to find the decision you are appealing.",
  nationalInsuranceNumberLabel: "National Insurance number",
  nationalInsuranceNumberHint: "It is on the decision letter, a payslip, or a letter about pensions or benefits. For example, QQ 12 34 56 C.",
  afcsMemberNumberLabel: "AFCS member number (optional)",
  afcsMemberNumberHint: "Only Armed Forces Compensation Scheme claims have one. Leave it blank if the appellant does not have one or does not know it.",
  errors: {
    nationalInsuranceNumberRequired: "Enter the appellant's National Insurance number",
    // No example here. The hint's "QQ 12 34 56 C" is the cross-government standard and is
    // deliberately not an issuable number, so repeating it in the error tells somebody who
    // typed what they were shown to type it again.
    nationalInsuranceNumberInvalid: "Enter a National Insurance number in the correct format, with 2 letters, 6 numbers and a final letter",
    afcsMemberNumberTooLong: "AFCS member number must be 30 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
