/**
 * Content for check-answers.
 *
 * The Design System's check-answers pattern. The declaration is on the next page rather
 * than at the bottom of this one: WPAF1 makes it a signed statement of truth, and a
 * statement of truth deserves its own page rather than a checkbox under a long list.
 */
export const en = {
  title: "Check your answers before sending your appeal",
  heading: "Check your answers before sending your appeal",
  lede: "Check that everything below is right. You can change any answer before you send your appeal.",
  change: "Change",
  notReadyHeading: "You have not finished your appeal",
  notReady: "Some sections are not complete. Go back to the task list and finish them before you send your appeal.",
  backToTaskList: "Back to the task list",
  continueText: "Continue to the declaration"
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
