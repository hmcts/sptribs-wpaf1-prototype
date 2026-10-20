/**
 * Content for appeal-is-very-late.
 *
 * Shown when the decision letter is more than 24 months old. The wording has to do two
 * things that pull against each other: say clearly that the tribunal has no power to
 * extend this limit, and not tell the citizen their appeal has been refused — because it
 * has not been, and this service is not the body that decides.
 *
 * It also offers the way out that does exist. A fresh claim or a request for Veterans UK
 * to look at the decision again is not barred by rule 21(4), and somebody two years past
 * the limit needs to know that more than they need the rule number.
 */
export const en = {
  title: "Your appeal is more than 2 years late",
  caption: "The decision you are appealing",
  heading: "Your appeal is more than 2 years late",
  lede: "The date on the decision letter is more than 24 months ago.",
  warning: "The tribunal cannot extend the time limit beyond 2 years. This is set by the tribunal's rules and no judge can change it.",
  whatHappens: [
    "You can still send your appeal, and the tribunal will look at what you say here. But you should know before you send it that the time limit for appealing this decision has passed.",
    "If you have new evidence about your condition, you can ask Veterans UK to look at the decision again or make a new claim instead. That is not affected by the time limit for appealing.",
    "Contact the tribunal if you are not sure which of those is right for you. They cannot give legal advice, but they can explain how the tribunal works."
  ],
  checkDate: "If the date you entered was wrong, go back and change it.",
  changeDate: "Change the date on the decision letter",
  lateAppealExplanationLabel: "Why is your appeal late?",
  lateAppealExplanationHint:
    "Give the full reasons for the delay, and say why you think the tribunal should look at your appeal even though the time limit has passed.",
  errors: {
    lateAppealExplanationRequired: "Explain why your appeal is late",
    lateAppealExplanationTooLong: "Your explanation must be 5,000 characters or fewer"
  }
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
