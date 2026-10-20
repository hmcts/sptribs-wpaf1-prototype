import type { Request, Response } from "express";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { cy, en } from "./uksf-disclosure.i18n.js";

/**
 * The UKSF Disclosure Cell confirmation.
 *
 * A single checkbox that has to be ticked, so there is no zod schema to speak of: there
 * is one acceptable answer and anything else is the error. Reached only from a "Yes" to
 * having served with UK Special Forces, and the hub requires it from that point on.
 */
const BACK = "/appeal/uksf";
const NEXT = "/appeal/task-list";

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).uksf;
  render(res, section.disclosureCellConfirmed ?? "", {});
};

const postHandler = async (req: Request, res: Response) => {
  if (req.body.disclosureCellConfirmed !== "Yes") {
    return render(res, "", { disclosureCellConfirmed: "disclosureCellConfirmedRequired" });
  }

  await updateDraft(req, "uksf", {
    disclosureCellConfirmed: "Yes"
  });
  res.redirect(302, NEXT);
};

function render(res: Response, disclosureCellConfirmed: string, errors: Record<string, string>): void {
  res.render("uksf-disclosure", { en, cy, values: { disclosureCellConfirmed }, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
