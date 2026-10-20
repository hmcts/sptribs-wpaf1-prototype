/**
 * Content for reasons.
 *
 * WPAF1 question 5.1, and the grounds the appeal relies on under rule 21(5). The hint is
 * the paper form's guidance note turned into a prompt, because the difference between an
 * answer the tribunal can work from and one it has to write back about is whether it says
 * what is wrong, why, and what the appellant wants instead.
 */
export const en = {
  title: "Why do you disagree with the decision?",
  caption: "Your reasons",
  appealReasonsLabel: "Why do you disagree with the decision?",
  appealReasonsHint:
    "For each thing you are appealing, say what you disagree with, why you disagree with it, and what you want the tribunal to decide instead. Mention any evidence that supports it.",
  errors: {
    appealReasonsRequired: "Explain why you disagree with the decision",
    appealReasonsTooLong: "Your reasons must be 10,000 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
