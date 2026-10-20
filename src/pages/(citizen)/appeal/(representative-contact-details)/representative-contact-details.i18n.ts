/**
 * Content for representative-contact-details.
 *
 * WPAF1 question 2.6. One of the three is required, as with the appellant's: a named
 * representative the tribunal cannot reach is worse than no representative at all,
 * because the tribunal writes to them instead of to the appellant.
 */
export const en = {
  title: "What are the representative's contact details?",
  caption: "The appellant's representative",
  contactDetailsLabel: "What are the representative's contact details?",
  contactDetailsHint: "Give at least one way for the tribunal to contact the representative.",
  phoneNumberLabel: "Phone number",
  mobileNumberLabel: "Mobile number",
  emailAddressLabel: "Email address",
  errors: {
    contactDetailsRequired: "Enter a phone number, a mobile number or an email address",
    phoneNumberTooLong: "Phone number must be 30 characters or fewer",
    mobileNumberTooLong: "Mobile number must be 30 characters or fewer",
    emailAddressInvalid: "Enter an email address in the correct format, like name@example.com",
    emailAddressTooLong: "Email address must be 255 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
