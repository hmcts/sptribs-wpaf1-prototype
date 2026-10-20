import type { Request, Response } from "express";
import { z } from "zod";
import { type AppealDraft, draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./appeal-is-very-late.i18n.js";

/**
 * More than 24 months after the decision — rule 21(4).
 *
 * This is the one limit the tribunal cannot reach past. Rule 21(4) bars an appeal made
 * more than 12 months after the end of the initial 12-month period, and the tribunal has
 * no power to extend it, not even under its general case-management or non-compliance
 * powers. GOV.UK says it plainly: "No appeal is possible after 2 years."
 *
 * The page says so, and still collects the reasons and still lets the appeal through. The
 * tribunal decides whether an appeal is admitted; a web form that refused to send one
 * would be making that decision on dates the citizen may have mistyped, and the
 * structurally identical SSCS service warns past its own outer bar rather than blocking.
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
  res.render("appeal-is-very-late", { en, cy, values, errors, backHref: BACK });
}

export const GET = getHandler;
export const POST = postHandler;
