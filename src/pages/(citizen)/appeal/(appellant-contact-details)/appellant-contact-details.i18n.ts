/**
 * Content for appellant-contact-details.
 *
 * WPAF1 question 1.3, which offers a phone number, a mobile number and an email address
 * and marks none of them as needed. One of the three is required here, because an appeal
 * the tribunal cannot acknowledge is of no use to the appellant — but which one is left
 * to them, since a veteran with no email address is not an edge case.
 */
export const en = {
  title: "What are the appellant's contact details?",
  caption: "About the appellant",
  contactDetailsLabel: "What are the appellant's contact details?",
  contactDetailsHint: "Give at least one way for the tribunal to contact the appellant.",
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
