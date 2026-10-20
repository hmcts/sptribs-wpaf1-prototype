/**
 * Content for cannot-use-this-service.
 *
 * A GOV.UK dead-end page, not a validation error. Nobody who reaches it has no route at
 * all: an appeal from Scotland or Northern Ireland goes to a different tribunal, and
 * somebody without the decision letter can ask Veterans UK for another copy. So the
 * page's job is to say which route is theirs and how to reach it.
 *
 * The paper WPAF1 is linked from every reason, because it is the route that works
 * everywhere this service does not.
 */
export const en = {
  title: "You cannot use this service",
  reasons: {
    scotland: {
      heading: "You cannot use this service to appeal in Scotland",
      body: [
        "This service sends appeals to the First-tier Tribunal (War Pensions and Armed Forces Compensation Chamber), which covers England and Wales only.",
        "Appeals from Scotland are decided by the Pensions Appeal Tribunal for Scotland, at George House in Edinburgh. It is a separate tribunal with its own address and its own privacy notice.",
        "Search for 'Pensions Appeal Tribunal Scotland' on GOV.UK to find their contact details, and send them the paper WPAF1 form."
      ]
    },
    northernIreland: {
      heading: "You cannot use this service to appeal in Northern Ireland",
      body: [
        "This service sends appeals to the First-tier Tribunal (War Pensions and Armed Forces Compensation Chamber), which covers England and Wales only.",
        "Appeals from Northern Ireland are decided by the Pensions Appeal Tribunal for Northern Ireland, and are sent through Veterans UK rather than to the tribunal directly.",
        "Search for 'Pensions Appeal Tribunal Northern Ireland' on GOV.UK to find out where to send your appeal, and use the paper WPAF1 form."
      ]
    },
    noDecisionLetter: {
      heading: "You need a copy of the decision letter",
      body: [
        "The tribunal cannot register your appeal without the decision you are appealing against, because the letter is the only place the decision's full reference appears.",
        "Contact Veterans UK and ask for another copy of the decision letter. Once you have it, come back and start your appeal.",
        "The time limit for appealing runs from the date on the decision letter, not from the date you got a copy. If you are close to the 12-month limit, tell the tribunal when you appeal."
      ]
    },
    general: {
      heading: "You cannot use this service",
      body: [
        "This service sends appeals to the First-tier Tribunal (War Pensions and Armed Forces Compensation Chamber), which covers England and Wales only.",
        "You can still appeal on the paper WPAF1 form, and you can contact the tribunal if you are not sure whether your appeal is one it can decide."
      ]
    }
  },
  formHeading: "The paper form",
  formBody: "You can download form WPAF1 and send it to the tribunal by post or email.",
  formLinkText: "Appeal a War Pension or Armed Forces Compensation Scheme decision (form WPAF1)",
  formLinkHref: "https://www.gov.uk/government/publications/appeal-a-war-pension-or-armed-forces-compensation-scheme-decision-form-wpaf1",
  helpHeading: "If you are not sure",
  help: "Contact the tribunal. They can help with the appeal form and with how the tribunal works, but they cannot give legal advice.",
  startAgain: "Start again"
};

// WPAF1 claims the England and Wales jurisdiction and rule 21(5) permits a notice of
// appeal in English or Welsh, so Welsh content is required before this could serve Wales.
// It is not done — see docs/service-design.md, which records it as a known gap.
export const cy = en;
