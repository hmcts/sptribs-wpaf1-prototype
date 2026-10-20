/**
 * Content for who-is-appealing.
 *
 * The paper form never asks this outright — it offers two sets of wording for the
 * declaration and leaves the signatory to pick. Asked here instead, at the top of the
 * hub, because the answer changes how every later question reads: somebody completing
 * the form for a relative should know from the first page that they are answering about
 * the veteran, not about themselves.
 */
export const en = {
  title: "Are you appealing for yourself or for someone else?",
  capacityLabel: "Are you appealing for yourself or for someone else?",
  capacityOptions: [
    {
      value: "self",
      text: "I am the appellant",
      hint: "The decision you are appealing is about you."
    },
    {
      value: "onBehalf",
      text: "I am appealing for someone else",
      hint: "For example, you are the appellant's representative or appointee, or a relative helping them."
    }
  ],
  errors: {
    capacityRequired: "Select whether you are appealing for yourself or for someone else"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
