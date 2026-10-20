import type { Request, Response } from "express";
import { type AppealDraft, appealTimeliness, draftFrom, updateDraft } from "#appeal";
import { parseDayMonthYear } from "#zod-validation";
import { cy, en } from "./decision-date.i18n.js";

/**
 * The date on the decision letter — WPAF1 question 4.1, and the gate's branch point.
 *
 * Rule 21's three windows all run from here, so `#appeal`'s `appealTimeliness` can say
 * nothing until it is answered: in time within 12 months, late between 12 and 24 months,
 * and past the point the tribunal can reach after 24 months. Each is a different page.
 *
 * Two routes reach this question. In the gate it follows the scheme and leads on through
 * the rest of the gate; from the hub it is one task among the others and leads back there.
 * `BACK` is the hub, because that is where it belongs once the gate is behind them, and
 * the gate's own back link is `GATE_BACK`.
 */
const BACK = "/appeal/task-list";
const GATE_BACK = "/appeal/which-scheme";
const NEXT = "/appeal/decision-letter-check";
const RECONSIDERATION = "/appeal/reconsideration";
const LATE = "/appeal/appeal-is-late";
const VERY_LATE = "/appeal/appeal-is-very-late";

/** The three parts as typed, kept as strings so a half-finished date survives a save. */
function dateParts(body: Record<string, unknown>, prefix: string) {
  return {
    day: String(body[`${prefix}-day`] ?? "").trim(),
    month: String(body[`${prefix}-month`] ?? "").trim(),
    year: String(body[`${prefix}-year`] ?? "").trim()
  };
}

/**
 * True once the citizen has been through the compliance gate.
 *
 * Confirming they have a copy of the decision letter is the last thing the gate asks, so
 * it is also the mark that the gate is done and this page is being revisited from the hub.
 */
const pastTheGate = (draft: AppealDraft): boolean => Boolean(draft.documentsChecklist.decisionLetter);

const getHandler = (req: Request, res: Response) => {
  const draft = draftFrom(req);
  render(
    req,
    res,
    {
      "decisionLetterDate-day": draft.decision.decisionLetterDate?.day ?? "",
      "decisionLetterDate-month": draft.decision.decisionLetterDate?.month ?? "",
      "decisionLetterDate-year": draft.decision.decisionLetterDate?.year ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const errors: Record<string, string> = {};
  const decisionLetterDate = parseDayMonthYear(req.body, "decisionLetterDate", {
    required: "decisionLetterDateRequired",
    invalid: "decisionLetterDateInvalid"
  });
  if (decisionLetterDate.error) {
    errors.decisionLetterDate = decisionLetterDate.error;
  }

  if (Object.keys(errors).length > 0) {
    return render(req, res, req.body, errors);
  }

  await updateDraft(req, "decision", {
    decisionLetterDate: dateParts(req.body, "decisionLetterDate")
  });

  const draft = draftFrom(req);
  const timeliness = appealTimeliness(draft);
  if (timeliness === "late") {
    return res.redirect(302, LATE);
  }
  if (timeliness === "beyondExtension") {
    return res.redirect(302, VERY_LATE);
  }
  res.redirect(302, pastTheGate(draft) ? BACK : draft.decision.scheme === "afcs" ? RECONSIDERATION : NEXT);
};

function render(req: Request, res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("decision-date", { en, cy, values, errors, backHref: pastTheGate(draftFrom(req)) ? BACK : GATE_BACK });
}

export const GET = getHandler;
export const POST = postHandler;
