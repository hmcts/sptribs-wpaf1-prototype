import type { Request, Response } from "express";
import { z } from "zod";
import { type AppealDraft, draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./appeal-is-late.i18n.js";

/**
 * The explanation for a late appeal — WPAF1 Section 7, rule 21(2).
 *
 * Reached when the decision letter is more than 12 months old but less than 24. A late
 * notice of appeal must state why it is late; it is then treated as in time unless the
 * decision maker objects, and it has 28 days to do so. So this is not a dead end and not
 * a warning — it is required input to a decision somebody else makes, which is why it
 * sits in the gate rather than as a task on the hub.
 */
const BACK = "/appeal/decision-date";
const NEXT = "/appeal/decision-letter-check";
const RECONSIDERATION = "/appeal/reconsideration";
const HUB = "/appeal/task-list";

const schema = z.object({
  lateAppealExplanation: z.string().trim().min(1, "lateAppealExplanationRequired").max(5000, "lateAppealExplanationTooLong")
});

/** True once the citizen has been through the gate, so this is a revisit from the hub. */
const pastTheGate = (draft: AppealDraft): boolean => Boolean(draft.documentsChecklist.decisionLetter);

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).timeliness;
  render(
    res,
    {
      lateAppealExplanation: section.lateAppealExplanation ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(res, req.body, errors);
  }

  await updateDraft(req, "timeliness", {
    ...parsed.data
  });

  const draft = draftFrom(req);
  res.redirect(302, pastTheGate(draft) ? HUB : draft.decision.scheme === "afcs" ? RECONSIDERATION : NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("appeal-is-late", { en, cy, values, errors, backHref: BACK });
}

export const GET = getHandler;
export const POST = postHandler;
