/**
 * Content for appointee-name.
 *
 * WPAF1 question 3.2, where the organisation is marked optional on the paper form too —
 * an appointee is often a relative.
 */
export const en = {
  title: "What is the appointee's name?",
  caption: "The appellant's appointee",
  heading: "What is the appointee's name?",
  firstNameLabel: "First name",
  lastNameLabel: "Last name",
  organisationLabel: "Company or organisation (optional)",
  errors: {
    firstNameRequired: "Enter the appointee's first name",
    firstNameTooLong: "First name must be 100 characters or fewer",
    lastNameRequired: "Enter the appointee's last name",
    lastNameTooLong: "Last name must be 100 characters or fewer",
    organisationTooLong: "Company or organisation must be 200 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
