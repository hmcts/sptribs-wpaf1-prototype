import type { Request, Response } from "express";
import { z } from "zod";
import { type AppealDraft, appealTimeliness, draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./reconsideration.i18n.js";

/**
 * Whether a Reconsideration has been asked for — WPAF1 Section 6.
 *
 * AFCS only. A War Pensions decision has no Reconsideration stage, so a War Pensions
 * appellant must never see this question — the guard redirects rather than rendering it,
 * because a question that does not apply is worse than one page fewer.
 *
 * Answering "No" does not stop the appeal. Where no Reconsideration has been sought the
 * tribunal must refer the form to Defence Business Services to reconsider first, which
 * the form calls a legal requirement — so the page explains the referral rather than
 * sending the citizen away to arrange it themselves.
 */
const BACK = "/appeal/decision-date";
const LATE_BACK = "/appeal/appeal-is-late";
const VERY_LATE_BACK = "/appeal/appeal-is-very-late";
const NEXT = "/appeal/decision-letter-check";
const HUB = "/appeal/task-list";

const schema = z.object({
  askedForReconsideration: z.enum(["Yes", "No"], { message: "askedForReconsiderationRequired" })
});

/** True once the citizen has been through the gate, so this is a revisit from the hub. */
const pastTheGate = (draft: AppealDraft): boolean => Boolean(draft.documentsChecklist.decisionLetter);

const getHandler = (req: Request, res: Response) => {
  const draft = draftFrom(req);
  if (draft.decision.scheme !== "afcs") {
    return res.redirect(302, pastTheGate(draft) ? HUB : NEXT);
  }
  render(
    req,
    res,
    {
      askedForReconsideration: draft.reconsideration.askedForReconsideration ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  if (draftFrom(req).decision.scheme !== "afcs") {
    return res.redirect(302, pastTheGate(draftFrom(req)) ? HUB : NEXT);
  }

  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(req, res, req.body, errors);
  }

  await updateDraft(req, "reconsideration", {
    ...parsed.data
  });
  res.redirect(302, pastTheGate(draftFrom(req)) ? HUB : NEXT);
};

function render(req: Request, res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("reconsideration", { en, cy, values, errors, backHref: gateBack(draftFrom(req)) });
}

/** Back the way they came: the hub if the gate is done, otherwise whichever date page sent them. */
function gateBack(draft: AppealDraft): string {
  if (pastTheGate(draft)) {
    return HUB;
  }
  const timeliness = appealTimeliness(draft);
  return timeliness === "beyondExtension" ? VERY_LATE_BACK : timeliness === "late" ? LATE_BACK : BACK;
}

export const GET = getHandler;
export const POST = postHandler;
