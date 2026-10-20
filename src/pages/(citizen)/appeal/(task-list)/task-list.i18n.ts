/**
 * Content for the task list.
 *
 * The task list pattern rather than one long form: WPAF1 has eight sections plus a
 * declaration, some of them about other people whose details the appellant may have to go
 * and ask for. A hub lets somebody do what they can, see what is left, and come back.
 *
 * Exported as a function because the progress line interpolates the counts. The starter's
 * render interceptor calls it with the view model, which is the only way a content string
 * can reference a dynamic value — a per-key function would land in the template as a
 * function and render as nothing.
 */
export const en = (params: { done?: number; total?: number }) => ({
  title: "Appeal a War Pension or Armed Forces Compensation Scheme decision",
  heading: "Your appeal",
  progress: `You have completed ${params.done ?? 0} of ${params.total ?? 0} sections.`,
  saveNote: "Your answers are saved as you go. You can leave this page and come back to it.",
  statusCompleted: "Completed",
  statusNotStarted: "Not started",
  statusOptional: "Optional",
  optionalHint: "You can send your appeal without answering this.",
  submitHeading: "Send your appeal",
  submitReady: "You have answered everything the tribunal needs. Check your answers, then send your appeal.",
  submitNotReady: "You cannot send your appeal until you have completed every section.",
  checkAnswers: "Check your answers"
});

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
