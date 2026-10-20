/**
 * Content for uksf.
 *
 * The UKSF confidentiality section of WPAF1. The question is deliberately wider than
 * "did you sign the contract": anyone who served with UK Special Forces has to take
 * advice before sending documents, whether or not they signed anything, and somebody who
 * never signed would answer no to the narrower question and send the documents anyway.
 */
export const en = {
  title: "Has the appellant served with UK Special Forces?",
  caption: "UK Special Forces",
  servedWithUksfLabel: "Has the appellant served with UK Special Forces?",
  servedWithUksfHint: "Answer yes if the appellant signed the UK Special Forces Confidentiality Contract, or served with UK Special Forces without signing it.",
  errors: {
    servedWithUksfRequired: "Select yes if the appellant has served with UK Special Forces"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
