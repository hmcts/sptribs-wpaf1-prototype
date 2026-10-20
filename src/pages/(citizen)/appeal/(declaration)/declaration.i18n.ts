/**
 * Content for the declaration.
 *
 * WPAF1's statement of truth and signature block. Its own page, because it is a statement
 * of truth: putting it under a long check-answers list makes it something people scroll
 * past. The two wordings are the paper form's first-person and third-person variants.
 *
 * Naming a representative and signing also authorises the tribunal and Veterans UK to
 * discuss the case with them, which the form says in a note beside the signature. It is
 * on the page here, because it is a consequence of signing and not a footnote.
 */
export const en = {
  title: "Declaration",
  heading: "Declaration",
  lede: "Read the declaration and choose the statement that is true of you. Then sign the appeal.",
  capacityLabel: "Which statement applies to you?",
  capacityOptions: [
    { value: "appellantSigning", text: "I am the appellant, and I believe that the facts stated in this appeal are true" },
    {
      value: "signingOnBehalf",
      text: "The appellant believes that the facts stated in this appeal are true, and I am authorised by the appellant to sign this appeal"
    }
  ],
  signatoryRoleLabel: "Who is signing this appeal?",
  signatoryRoleOptions: [
    { value: "appellant", text: "The appellant" },
    { value: "representative", text: "The representative" },
    { value: "appointee", text: "The appointee" }
  ],
  signingGroundLabel: "Why is the appointee signing instead of the appellant?",
  signingGroundHint: "An appointee can only sign on the appellant's behalf for one of these reasons.",
  signingGroundOptions: [
    { value: "underSixteen", text: "The appellant is under 16" },
    { value: "infirmity", text: "The appellant cannot sign because of mental or physical infirmity" }
  ],
  fullNameLabel: "Full name",
  signatureLabel: "Signature",
  signatureHint: "Type your name.",
  dateSignedLabel: "Date",
  dateSignedHint: "For example, 27 3 2026",
  representativeNote: "If you have named a representative, signing this appeal also allows the tribunal and Veterans UK to discuss your case with them.",
  warning: "Once you send your appeal you cannot change your answers in this service. If something needs to change, contact the tribunal.",
  continueText: "Accept and send your appeal",
  errors: {
    capacityRequired: "Select the statement that applies to you",
    signatoryRoleRequired: "Select who is signing this appeal",
    signingGroundRequired: "Select why the appointee is signing instead of the appellant",
    fullNameRequired: "Enter your full name",
    fullNameTooLong: "Full name must be 100 characters or fewer",
    signatureRequired: "Type your name to sign this appeal",
    signatureTooLong: "Signature must be 100 characters or fewer",
    dateSignedRequired: "Enter the date you are signing this appeal",
    dateSignedInvalid: "The date must be a real date"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
