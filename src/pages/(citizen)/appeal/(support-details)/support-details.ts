import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./support-details.i18n.js";

/**
 * The support being asked for — WPAF1 question 8.1.
 */
const BACK = "/appeal/support";
const NEXT = "/appeal/task-list";

const schema = z.object({
  supportDetails: z.string().trim().min(1, "supportDetailsRequired").max(5000, "supportDetailsTooLong")
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).support;
  render(
    res,
    {
      supportDetails: section.supportDetails ?? ""
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

  await updateDraft(req, "support", {
    ...parsed.data
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("support-details", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
