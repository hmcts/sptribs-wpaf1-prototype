/**
 * Content for service-status.
 *
 * WPAF1 question 1.4. The answer decides whether a proposed discharge date can exist,
 * which is why it is asked before it rather than alongside it.
 */
export const en = {
  title: "Is the appellant still serving?",
  caption: "About the appellant",
  serviceStatusLabel: "Is the appellant still serving in the armed forces?",
  serviceStatusOptions: [
    {
      value: "stillServing",
      text: "Still serving",
      hint: "Including anyone in the reserve forces who has not been discharged."
    },
    {
      value: "leftService",
      text: "Left service"
    }
  ],
  errors: {
    serviceStatusRequired: "Select whether the appellant is still serving"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
