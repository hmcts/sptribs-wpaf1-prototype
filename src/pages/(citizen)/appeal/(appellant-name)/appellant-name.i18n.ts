/**
 * Content for appellant-name.
 *
 * WPAF1 question 1.1. The questions about the appellant are asked in the third person
 * throughout, because a representative, an appointee or a relative may be the one filling
 * the form in — and "your name" would then collect the wrong name without anybody
 * noticing. Title is offered but not required: the tribunal does not need one to register
 * an appeal.
 */
export const en = {
  title: "What is the appellant's name?",
  caption: "About the appellant",
  heading: "What is the appellant's name?",
  titleLabel: "Title (optional)",
  titleHint: "For example, Mr, Mrs, Ms, Dr, Major.",
  firstNameLabel: "First name",
  lastNameLabel: "Last name",
  errors: {
    titleTooLong: "Title must be 50 characters or fewer",
    firstNameRequired: "Enter the appellant's first name",
    firstNameTooLong: "First name must be 100 characters or fewer",
    lastNameRequired: "Enter the appellant's last name",
    lastNameTooLong: "Last name must be 100 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
