import { needsLateExplanation } from "./deadline.js";
import { applicableTasks } from "./sections.js";
import type { Address, AppealDraft, DateAnswer } from "./types.js";

/**
 * The appeal as summary-list rows, for check-your-answers.
 *
 * Built here rather than in the template so the wording of an answer is decided in one
 * place. The rule that matters: a citizen must see back exactly what they said, in the
 * words they chose it by. So a radio answer is shown as its option text, not its code,
 * and a code with no matching option shows as the code rather than silently as blank —
 * a missing label is a bug worth seeing.
 *
 * Every row carries a change link back to the page that asked the question, and every
 * change link says what it changes: "Change the date on the decision letter", not
 * "Change". The gate's answers are included, with change links back into the gate: they
 * are facts about the appeal, and a citizen who mistyped the decision date must be able
 * to correct it here rather than start again.
 */

export interface SummaryRow {
  key: string;
  value: string;
  href: string;
  /** Completes "Change …" for the visually hidden part of the link. */
  changes: string;
}

export interface SummarySection {
  title: string;
  rows: SummaryRow[];
}

const LABELS: Record<string, Record<string, string>> = {
  livesIn: { england: "England", wales: "Wales", scotland: "Scotland", northernIreland: "Northern Ireland" },
  scheme: {
    warPension: "War Pensions Scheme — injury caused or made worse by service before 6 April 2005",
    afcs: "Armed Forces Compensation Scheme — injury caused by service on or after 6 April 2005"
  },
  capacity: {
    self: "I am the appellant",
    onBehalf: "I am appealing for someone else"
  },
  serviceStatus: { stillServing: "Still serving", leftService: "Left service" },
  appealAbout: {
    entitlement: "The refusal of an award, or the level of entitlement",
    awardLevel: "The level of an award — the percentage assessment, or the rate of allowance or tariff level",
    awardStartDate: "The date an award starts",
    awardChanges: "Changes to the amount or duration of an award",
    label: "The label — the medical name given for a claimed condition",
    other: "Something else"
  },
  signingGround: {
    underSixteen: "The appellant is under 16",
    infirmity: "The appellant cannot sign because of mental or physical infirmity"
  },
  signatoryRole: { appellant: "Appellant", representative: "Representative", appointee: "Appointee" }
};

const NOT_ANSWERED = "Not answered";

export function summarise(draft: AppealDraft): SummarySection[] {
  const shown = new Set(applicableTasks(draft).map((task) => task.slug));
  const only = (slug: string, rows: SummaryRow[]): SummaryRow[] => (shown.has(slug) ? rows : []);

  const sections: SummarySection[] = [
    {
      title: "Where you live and the scheme",
      rows: [
        row("Where the appellant lives", label("livesIn", draft.appellant.livesIn), "where-do-you-live", "where the appellant lives"),
        row("The scheme the decision was made under", label("scheme", draft.decision.scheme), "which-scheme", "the scheme the decision was made under")
      ]
    },
    {
      title: "Who is appealing",
      rows: [row("Who is appealing", label("capacity", draft.declaration.capacity), "who-is-appealing", "who is appealing")]
    },
    {
      title: "About the appellant",
      rows: [
        row("Title", text(draft.appellant.title), "appellant-name", "the appellant's title"),
        row("Name", joined([draft.appellant.firstName, draft.appellant.lastName]), "appellant-name", "the appellant's name"),
        row("Date of birth", date(draft.appellant.dateOfBirth), "date-of-birth", "the appellant's date of birth"),
        row("National Insurance number", text(draft.appellant.nationalInsuranceNumber), "reference-numbers", "the National Insurance number"),
        row("AFCS member number", text(draft.appellant.afcsMemberNumber), "reference-numbers", "the AFCS member number"),
        row("Address", address(draft.appellant.address), "appellant-address", "the appellant's address"),
        row("Phone number", text(draft.appellant.phoneNumber), "appellant-contact-details", "the phone number"),
        row("Mobile number", text(draft.appellant.mobileNumber), "appellant-contact-details", "the mobile number"),
        row("Email address", text(draft.appellant.emailAddress), "appellant-contact-details", "the email address"),
        row("Service status", label("serviceStatus", draft.appellant.serviceStatus), "service-status", "whether the appellant is still serving"),
        ...only("discharge-date", [
          row("Proposed discharge date", date(draft.appellant.proposedDischargeDate), "discharge-date", "the proposed discharge date")
        ])
      ]
    },
    {
      title: "The appellant's representative",
      rows: [
        row("There is a representative", text(draft.representative.hasRepresentative), "representative", "whether there is a representative"),
        ...only("representative-name", [
          row("Their name", joined([draft.representative.firstName, draft.representative.lastName]), "representative-name", "the representative's name"),
          row("Their company or organisation", text(draft.representative.organisation), "representative-name", "the representative's organisation"),
          row("Their address", address(draft.representative.address), "representative-address", "the representative's address"),
          row("Their DX number", text(draft.representative.dxNumber), "representative-reference", "the representative's DX number"),
          row("Their reference number", text(draft.representative.referenceNumber), "representative-reference", "the representative's reference number"),
          row("Their phone number", text(draft.representative.phoneNumber), "representative-contact-details", "the representative's phone number"),
          row("Their mobile number", text(draft.representative.mobileNumber), "representative-contact-details", "the representative's mobile number"),
          row("Their email address", text(draft.representative.emailAddress), "representative-contact-details", "the representative's email address")
        ])
      ]
    },
    {
      title: "The appellant's appointee",
      rows: [
        row("There is an appointee", text(draft.appointee.hasAppointee), "appointee", "whether there is an appointee"),
        ...only("appointee-name", [
          row("Their name", joined([draft.appointee.firstName, draft.appointee.lastName]), "appointee-name", "the appointee's name"),
          row("Their company or organisation", text(draft.appointee.organisation), "appointee-name", "the appointee's organisation"),
          row("Their address", address(draft.appointee.address), "appointee-address", "the appointee's address"),
          row("Their phone number", text(draft.appointee.phoneNumber), "appointee-contact-details", "the appointee's phone number"),
          row("Their mobile number", text(draft.appointee.mobileNumber), "appointee-contact-details", "the appointee's mobile number"),
          row("Their email address", text(draft.appointee.emailAddress), "appointee-contact-details", "the appointee's email address")
        ])
      ]
    },
    {
      title: "The decision you are appealing",
      rows: [
        row("Date on the decision letter", date(draft.decision.decisionLetterDate), "decision-date", "the date on the decision letter"),
        row("What you are appealing about", list(draft.decision.appealAbout, "appealAbout"), "what-you-are-appealing", "what you are appealing about"),
        ...when((draft.decision.appealAbout ?? []).includes("other"), [
          row("What else you are appealing about", text(draft.decision.appealAboutOther), "what-you-are-appealing", "what else you are appealing about")
        ])
      ]
    },
    {
      title: "Your reasons",
      rows: [row("Why you disagree with the decision", text(draft.reasons.appealReasons), "reasons", "why you disagree with the decision")]
    },
    {
      title: "Reconsideration and time limits",
      rows: [
        // Section 6 is an AFCS question. A War Pensions appellant is never asked it, so the
        // row would read as something they failed to answer.
        ...when(draft.decision.scheme === "afcs", [
          row("Asked for a reconsideration", text(draft.reconsideration.askedForReconsideration), "reconsideration", "whether you asked for a reconsideration")
        ]),
        ...when(needsLateExplanation(draft), [
          row("Why the appeal is late", text(draft.timeliness.lateAppealExplanation), "appeal-is-late", "why the appeal is late")
        ])
      ]
    },
    {
      title: "Support during your appeal",
      rows: [
        row("Additional support is needed", text(draft.support.needsSupport), "support", "whether additional support is needed"),
        ...when(draft.support.needsSupport === "Yes", [row("Support needed", text(draft.support.supportDetails), "support-details", "the support needed")])
      ]
    },
    {
      title: "UK Special Forces",
      rows: [
        row("Served with UK Special Forces", text(draft.uksf.servedWithUksf), "uksf", "whether they served with UK Special Forces"),
        ...only("uksf-disclosure", [
          row("Taken UKSF Disclosure Cell advice", text(draft.uksf.disclosureCellConfirmed), "uksf-disclosure", "the UKSF Disclosure Cell confirmation")
        ])
      ]
    },
    {
      title: "Documents and evidence",
      rows: [
        row("Documents you are sending", documents(draft), "documents-checklist", "the documents you are sending"),
        row("Supporting evidence", evidence(draft), "supporting-evidence", "your supporting evidence")
      ]
    }
  ];

  return sections.filter((section) => section.rows.length > 0);
}

const when = (condition: boolean, rows: SummaryRow[]): SummaryRow[] => (condition ? rows : []);

function row(key: string, value: string, slug: string, changes: string): SummaryRow {
  return { key, value, href: `/appeal/${slug}`, changes };
}

const text = (value: string | undefined): string => (value?.trim() ? value.trim() : NOT_ANSWERED);

const joined = (parts: (string | undefined)[]): string => {
  const present = parts.map((part) => part?.trim()).filter(Boolean);
  return present.length > 0 ? present.join(" ") : NOT_ANSWERED;
};

const label = (group: string, code: string | undefined): string => (code ? (LABELS[group]?.[code] ?? code) : NOT_ANSWERED);

const list = (codes: string[] | undefined, group: string): string => (codes?.length ? codes.map((code) => label(group, code)).join("\n") : NOT_ANSWERED);

/** A date the citizen can recognise: 27 March 2007, not 2007-03-27. */
function date(value: DateAnswer | undefined): string {
  if (!value?.day || !value?.month || !value?.year) {
    return NOT_ANSWERED;
  }
  const month = Number(value.month);
  const name = MONTHS[month - 1];
  return name ? `${Number(value.day)} ${name} ${value.year}` : `${value.day}/${value.month}/${value.year}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const address = (value: Address | undefined): string => {
  const lines = [value?.addressLine1, value?.addressLine2, value?.townOrCity, value?.county, value?.postcode].map((line) => line?.trim()).filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : NOT_ANSWERED;
};

function documents(draft: AppealDraft): string {
  const names: string[] = [];
  if (draft.documentsChecklist.decisionLetter) {
    names.push("A copy of the decision letter");
  }
  if (draft.documentsChecklist.evidenceList) {
    names.push("A list of the additional evidence being sent");
  }
  return names.length > 0 ? names.join("\n") : NOT_ANSWERED;
}

function evidence(draft: AppealDraft): string {
  if (draft.supportingEvidence.length === 0) {
    return "None added";
  }
  return draft.supportingEvidence.map((item) => item.evidenceDescription ?? "").join("\n");
}
