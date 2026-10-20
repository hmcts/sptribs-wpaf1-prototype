import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./who-is-appealing.i18n.js";

/**
 * Whether the appeal is the signatory's own.
 *
 * Stored on the declaration section because that is what it decides: the statement of
 * truth has a first-person and a third-person wording, and the declaration page offers
 * the one that matches this answer rather than asking again at the end.
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/task-list";

const schema = z.object({
  capacity: z.enum(["appellantSigning", "signingOnBehalf"], { message: "capacityRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).declaration;
  render(
    res,
    {
      capacity: section.capacity ?? ""
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

  await updateDraft(req, "declaration", {
    ...parsed.data
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("who-is-appealing", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
