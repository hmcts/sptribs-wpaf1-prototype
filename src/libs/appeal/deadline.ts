import { isoDate } from "./case-data.js";
import type { AppealDraft, DateAnswer } from "./types.js";

/**
 * Whether the appeal is in time, late, or past the point the tribunal can reach.
 *
 * Rule 21 of the Tribunal Procedure (First-tier Tribunal) (War Pensions and Armed Forces
 * Compensation Chamber) Rules 2008 gives three windows, all measured from the date the
 * written notice of the decision was sent — which the form expresses as the date on the
 * decision letter:
 *
 * - **rule 21(1)** — within 12 months, the appeal is in time.
 * - **rule 21(2)–(3)** — after 12 months the notice must say why it is late. It is
 *   treated as in time unless the decision maker objects, which it has 28 days to do.
 * - **rule 21(4)** — no appeal may be made more than 12 months after the end of that
 *   first 12 months. **Rule 21(7)** then forbids extending that limit in terms,
 *   expressly overriding rule 5(3)(a) (case management powers) and rule 7(2) (failure
 *   to comply), so it is a stated prohibition rather than a power found elsewhere.
 *   GOV.UK puts it plainly: "No appeal is possible after 2 years."
 *
 * None of that is a dead end in this service. The tribunal, not a web form, decides
 * whether an appeal is admitted, and SSCS — the structurally identical benefit-appeal
 * service — warns past its own outer bar rather than blocking. So past 24 months the
 * journey says what rule 21(4) means, still collects the reasons, and still submits.
 */

/** Which of rule 21's three windows the decision letter date falls in. */
export type Timeliness = "unknown" | "inTime" | "late" | "beyondExtension";

export interface TimeLimit {
  /** The last day an appeal is in time, ISO. Undefined until a date is given. */
  deadline?: string;
  /** The rule 21(4) outer limit, ISO, beyond which the tribunal cannot extend. */
  finalDeadline?: string;
  timeliness: Timeliness;
}

/** 12 months to appeal (rule 21(1)), and 12 more before the bar falls (rule 21(4)). */
const IN_TIME_MONTHS = 12;
const OUTER_LIMIT_MONTHS = 24;

export function timeLimit(draft: AppealDraft, today: Date = new Date()): TimeLimit {
  const decisionLetter = parse(draft.decision.decisionLetterDate);

  if (!decisionLetter) {
    return { timeliness: "unknown" };
  }

  const deadline = addMonths(decisionLetter, IN_TIME_MONTHS);
  const finalDeadline = addMonths(decisionLetter, OUTER_LIMIT_MONTHS);
  const now = startOfDay(today).getTime();

  return {
    deadline: toIso(deadline),
    finalDeadline: toIso(finalDeadline),
    // Both boundaries are inclusive: the deadline itself is still a day to appeal on.
    timeliness: now <= deadline.getTime() ? "inTime" : now <= finalDeadline.getTime() ? "late" : "beyondExtension"
  };
}

/**
 * The one predicate the gate branches on.
 *
 * `/decision-date` chooses between continuing, `/appeal-is-late` and
 * `/appeal-is-very-late` on this, and nothing else in the journey re-derives the rule.
 */
export function appealTimeliness(draft: AppealDraft, today: Date = new Date()): Timeliness {
  return timeLimit(draft, today).timeliness;
}

/** True when the citizen has to explain a late appeal — rule 21(2). */
export function needsLateExplanation(draft: AppealDraft, today: Date = new Date()): boolean {
  const timeliness = appealTimeliness(draft, today);
  return timeliness === "late" || timeliness === "beyondExtension";
}

function parse(date: DateAnswer | undefined): Date | undefined {
  const iso = date && isoDate(date);
  if (!iso) {
    return undefined;
  }
  // Parsed from the parts rather than from the string, because `new Date("…")` on a
  // date-only string is UTC midnight while `today` is local — a comparison that is
  // wrong by a day for anyone west of Greenwich.
  const [year, month, day] = iso.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Add whole months, clamping to the end of the target month.
 *
 * 29 February plus 12 months is 28 February, not 1 March: the deadline must never fall
 * outside the month a person would count to.
 */
function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
