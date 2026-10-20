import type { Request, Response } from "express";
import { z } from "zod";
import { type AppealDraft, appealTimeliness, draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./decision-letter-check.i18n.js";

/**
 * Do they have a copy of the decision letter — the last thing the gate asks.
 *
 * Rule 21(5) requires the notice of appeal to give details of the decision including its
 * full reference, and the decision letter is where those are. Somebody without it cannot
 * complete the appeal, so this is a dead end rather than a warning — but a recoverable
 * one: Veterans UK will send another copy, and the off-ramp says so.
 *
 * Answering yes ticks the decision letter on the documents checklist, which is the same
 * question the hub's documents task asks. It is also what marks the gate as done, so the
 * date and late-appeal pages know they are being revisited from the hub rather than
 * walked through for the first time.
 */
const BACK = "/appeal/decision-date";
const LATE_BACK = "/appeal/appeal-is-late";
const VERY_LATE_BACK = "/appeal/appeal-is-very-late";
const RECONSIDERATION_BACK = "/appeal/reconsideration";
const NEXT = "/appeal/task-list";
const NO_LETTER = "/appeal/cannot-use-this-service?reason=noDecisionLetter";

const schema = z.object({
  hasDecisionLetter: z.enum(["Yes", "No"], { message: "hasDecisionLetterRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const checklist = draftFrom(req).documentsChecklist;
  render(
    req,
    res,
    {
      hasDecisionLetter: checklist.decisionLetter ? "Yes" : ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(req, res, req.body, errors);
  }

  if (parsed.data.hasDecisionLetter === "No") {
    return res.redirect(302, NO_LETTER);
  }

  // Merged rather than replaced: the hub's documents task owns the rest of the checklist.
  await updateDraft(req, "documentsChecklist", { decisionLetter: true });
  res.redirect(302, NEXT);
};

function render(req: Request, res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("decision-letter-check", { en, cy, values, errors, backHref: gateBack(draftFrom(req)) });
}

/** Back the way they came: the reconsideration question on AFCS, otherwise the date page. */
function gateBack(draft: AppealDraft): string {
  if (draft.decision.scheme === "afcs") {
    return RECONSIDERATION_BACK;
  }
  const timeliness = appealTimeliness(draft);
  return timeliness === "beyondExtension" ? VERY_LATE_BACK : timeliness === "late" ? LATE_BACK : BACK;
}

export const GET = getHandler;
export const POST = postHandler;
