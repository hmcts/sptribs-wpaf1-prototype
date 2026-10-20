import type { AppealDraft } from "./types.js";

/**
 * The task list, as data.
 *
 * This is a manifest, not a configuration service: it is a TypeScript module in the
 * same repo as the pages, type-checked against the draft, and the pages still own
 * their own routing through `BACK`/`NEXT` constants. It exists so that the task list
 * and check-your-answers are one component each reading one list, rather than two
 * hand-maintained copies of the same ordering that drift apart the first time a
 * question moves.
 *
 * `applies` is what makes the list honest. WPAF1 branches on four answers — a
 * representative, an appointee, still serving, UK Special Forces — and each one opens
 * a run of questions that nobody else should be shown. A task list offering tasks the
 * citizen must not answer is worse than no task list.
 *
 * Note what is *not* here. The compliance gate — where they live, which scheme, the
 * decision date, a late appeal, the AFCS reconsideration — runs before the hub as a
 * linear sequence, because its answers decide whether the tribunal can admit the
 * appeal at all and that is not a thing to leave as an unticked task.
 */
export interface Task {
  /** Path under /appeal, and the id used in the task list. */
  slug: string;
  title: string;
  /** True once this task has everything it needs. */
  complete: (draft: AppealDraft) => boolean;
  /** False when this appeal does not reach the task at all. */
  applies?: (draft: AppealDraft) => boolean;
  /**
   * True when the appeal can be sent without this task.
   *
   * Optional tasks are shown but not counted, and never hold up submission. Marking one here
   * is what keeps the hub honest: an optional task the citizen has nothing to put in stays
   * un-ticked forever, so counting it means the progress line can never reach the total while
   * the submit copy says everything needed has been answered — the page contradicting itself.
   */
  optional?: boolean;
}

export interface TaskGroup {
  id: string;
  title: string;
  tasks: Task[];
}

const answered = (value: unknown): boolean => {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(answered);
  }
  return true;
};

const dateAnswered = (date: { day?: string; month?: string; year?: string } | undefined): boolean => Boolean(date?.day && date?.month && date?.year);

/** True when the appellant has not left the armed forces, so a discharge date can exist. */
export const stillServing = (draft: AppealDraft): boolean => draft.appellant.serviceStatus === "stillServing";

/** True when somebody is named as the appellant's representative. */
export const hasRepresentative = (draft: AppealDraft): boolean => draft.representative.hasRepresentative === "Yes";

/** True when somebody is acting as the appellant's appointee. */
export const hasAppointee = (draft: AppealDraft): boolean => draft.appointee.hasAppointee === "Yes";

/**
 * True when the UKSF Disclosure Cell has to be consulted.
 *
 * Anyone who signed the UKSF Confidentiality Contract — and anyone who served with UK
 * Special Forces without signing it — must take advice before sending documents, so
 * the confirmation is asked rather than assumed.
 */
export const servedWithUksf = (draft: AppealDraft): boolean => draft.uksf.servedWithUksf === "Yes";

export const TASK_GROUPS: TaskGroup[] = [
  {
    id: "who-is-appealing",
    title: "Who is appealing",
    tasks: [
      {
        slug: "who-is-appealing",
        title: "Whether you are the appellant",
        complete: (draft) => answered(draft.declaration.capacity)
      }
    ]
  },
  {
    id: "about-the-appellant",
    title: "About the appellant",
    tasks: [
      {
        slug: "appellant-name",
        title: "Their name and title",
        complete: (draft) => answered(draft.appellant.firstName) && answered(draft.appellant.lastName)
      },
      {
        slug: "date-of-birth",
        title: "Their date of birth",
        complete: (draft) => dateAnswered(draft.appellant.dateOfBirth)
      },
      {
        slug: "reference-numbers",
        title: "National Insurance and AFCS member number",
        // Rule 21(5) requires details of the decision including its full reference, and the
        // National Insurance number is what serves as that reference in practice — so it is
        // required where the paper form leaves it looking optional. The AFCS member number is
        // genuinely "if known".
        complete: (draft) => answered(draft.appellant.nationalInsuranceNumber)
      },
      {
        slug: "appellant-address",
        title: "Their address",
        complete: (draft) =>
          answered(draft.appellant.address?.addressLine1) && answered(draft.appellant.address?.townOrCity) && answered(draft.appellant.address?.postcode)
      },
      {
        slug: "appellant-contact-details",
        title: "Their contact details",
        complete: (draft) => answered(draft.appellant.phoneNumber) || answered(draft.appellant.mobileNumber) || answered(draft.appellant.emailAddress)
      },
      {
        slug: "service-status",
        title: "Whether they are still serving",
        complete: (draft) => answered(draft.appellant.serviceStatus)
      },
      {
        slug: "discharge-date",
        title: "Their proposed discharge date",
        applies: stillServing,
        complete: (draft) => dateAnswered(draft.appellant.proposedDischargeDate),
        // "If known" on the paper form, and somebody still serving often does not know it.
        optional: true
      }
    ]
  },
  {
    id: "representative",
    title: "The appellant's representative",
    tasks: [
      {
        slug: "representative",
        title: "Whether there is a representative",
        complete: (draft) => answered(draft.representative.hasRepresentative)
      },
      {
        slug: "representative-name",
        title: "Their name and organisation",
        applies: hasRepresentative,
        complete: (draft) => answered(draft.representative.firstName) && answered(draft.representative.lastName)
      },
      {
        slug: "representative-address",
        title: "Their address",
        applies: hasRepresentative,
        complete: (draft) =>
          answered(draft.representative.address?.addressLine1) &&
          answered(draft.representative.address?.townOrCity) &&
          answered(draft.representative.address?.postcode)
      },
      {
        slug: "representative-reference",
        title: "Their DX and reference number",
        applies: hasRepresentative,
        // Both are "if you have one" on the paper form, and a family member acting as
        // representative has neither.
        optional: true,
        complete: (draft) => answered(draft.representative.dxNumber) || answered(draft.representative.referenceNumber)
      },
      {
        slug: "representative-contact-details",
        title: "Their contact details",
        applies: hasRepresentative,
        complete: (draft) =>
          answered(draft.representative.phoneNumber) || answered(draft.representative.mobileNumber) || answered(draft.representative.emailAddress)
      }
    ]
  },
  {
    id: "appointee",
    title: "The appellant's appointee",
    tasks: [
      {
        slug: "appointee",
        title: "Whether there is an appointee",
        complete: (draft) => answered(draft.appointee.hasAppointee)
      },
      {
        slug: "appointee-name",
        title: "Their name and organisation",
        applies: hasAppointee,
        complete: (draft) => answered(draft.appointee.firstName) && answered(draft.appointee.lastName)
      },
      {
        slug: "appointee-address",
        title: "Their address",
        applies: hasAppointee,
        complete: (draft) =>
          answered(draft.appointee.address?.addressLine1) && answered(draft.appointee.address?.townOrCity) && answered(draft.appointee.address?.postcode)
      },
      {
        slug: "appointee-contact-details",
        title: "Their contact details",
        applies: hasAppointee,
        complete: (draft) => answered(draft.appointee.phoneNumber) || answered(draft.appointee.mobileNumber) || answered(draft.appointee.emailAddress)
      }
    ]
  },
  {
    id: "the-decision",
    title: "The decision you are appealing",
    tasks: [
      {
        // Asked in the compliance gate, because the 12- and 24-month limits run from it.
        // Listed here as well so it can be changed from the hub like any other answer.
        slug: "decision-date",
        title: "The date on the decision letter",
        complete: (draft) => dateAnswered(draft.decision.decisionLetterDate)
      },
      {
        slug: "what-you-are-appealing",
        title: "What you are appealing about",
        complete: (draft) => answered(draft.decision.appealAbout)
      }
    ]
  },
  {
    id: "your-reasons",
    title: "Your reasons",
    tasks: [
      {
        slug: "reasons",
        title: "Why you disagree with the decision",
        complete: (draft) => answered(draft.reasons.appealReasons)
      }
    ]
  },
  {
    id: "support",
    title: "Support during your appeal",
    tasks: [
      {
        slug: "support",
        title: "Whether anyone needs additional support",
        complete: (draft) => answered(draft.support.needsSupport)
      }
    ]
  },
  {
    id: "documents",
    title: "Documents and evidence",
    tasks: [
      {
        slug: "documents-checklist",
        title: "The documents you are sending",
        complete: (draft) => Boolean(draft.documentsChecklist.decisionLetter)
      },
      {
        slug: "supporting-evidence",
        title: "Your supporting evidence",
        // Veterans UK serves the claim papers after the appeal is lodged and the appellant
        // then has a month to reply, so this is not the last chance to send anything and an
        // appeal with nothing to list here is complete.
        optional: true,
        complete: (draft) => draft.supportingEvidence.length > 0
      }
    ]
  },
  {
    id: "uksf",
    title: "UK Special Forces",
    tasks: [
      {
        slug: "uksf",
        title: "Whether they served with UK Special Forces",
        complete: (draft) => answered(draft.uksf.servedWithUksf)
      },
      {
        slug: "uksf-disclosure",
        title: "UKSF Disclosure Cell advice",
        applies: servedWithUksf,
        complete: (draft) => draft.uksf.disclosureCellConfirmed === "Yes"
      }
    ]
  }
];

/** The tasks that apply to this appeal, flattened. */
export function applicableTasks(draft: AppealDraft): Task[] {
  return TASK_GROUPS.flatMap((group) => group.tasks).filter((task) => task.applies?.(draft) ?? true);
}

/** The tasks this appeal cannot be sent without. */
export function requiredTasks(draft: AppealDraft): Task[] {
  return applicableTasks(draft).filter((task) => !task.optional);
}

/** Whether the appeal can be submitted. */
export function readyToSubmit(draft: AppealDraft): boolean {
  return requiredTasks(draft).every((task) => task.complete(draft));
}

/**
 * Progress, over the tasks that have to be done.
 *
 * Optional tasks are left out of both halves rather than the numerator only, so the count can
 * actually reach its total. Including them meant a citizen with no supporting evidence to list
 * read "23 of 24 sections" directly above "You have answered everything the tribunal needs".
 */
export function completedCount(draft: AppealDraft): { done: number; total: number } {
  const tasks = requiredTasks(draft);
  return { done: tasks.filter((task) => task.complete(draft)).length, total: tasks.length };
}
