/**
 * Content for uksf-disclosure.
 *
 * The UKSF confirmation on WPAF1. The form offers a first-person and a third-person
 * wording; one checkbox covers both, worded for whoever is filling the form in, because
 * the thing being confirmed is the same either way — that advice has been taken before
 * any documents are sent.
 */
export const en = {
  title: "Confirm advice from the UKSF Disclosure Cell",
  caption: "UK Special Forces",
  heading: "Confirm advice from the UKSF Disclosure Cell",
  body: [
    "Anyone who has served with UK Special Forces must take advice from the UKSF Disclosure Cell before sending documents to the tribunal or to Veterans UK.",
    "This is to make sure nothing in the appeal discloses information that is still protected. Take the advice before you send your appeal, not afterwards."
  ],
  disclosureCellConfirmedLabel: "I confirm that advice has been taken from the UKSF Disclosure Cell about the documents being sent with this appeal",
  errors: {
    disclosureCellConfirmedRequired: "You must confirm that advice has been taken from the UKSF Disclosure Cell"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
