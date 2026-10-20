/**
 * Content for representative-name.
 *
 * WPAF1 question 2.2. The organisation is optional because a representative does not have
 * to belong to one — a relative or a friend acting for the appellant has nothing to put
 * there, and the paper form's blank line does not say so.
 */
export const en = {
  title: "What is the representative's name?",
  caption: "The appellant's representative",
  heading: "What is the representative's name?",
  firstNameLabel: "First name",
  lastNameLabel: "Last name",
  organisationLabel: "Company or organisation (optional)",
  organisationHint: "For example, a firm of solicitors, or a charity such as the Royal British Legion.",
  errors: {
    firstNameRequired: "Enter the representative's first name",
    firstNameTooLong: "First name must be 100 characters or fewer",
    lastNameRequired: "Enter the representative's last name",
    lastNameTooLong: "Last name must be 100 characters or fewer",
    organisationTooLong: "Company or organisation must be 200 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
