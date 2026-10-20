import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./representative-reference.i18n.js";

/**
 * The representative's DX and reference numbers — WPAF1 questions 2.4 and 2.5.
 *
 * Both optional, so this page has no required messages at all: leaving it blank is an
 * answer, and the task list counts it as optional so a blank one never blocks submission.
 */
const BACK = "/appeal/representative-address";
const NEXT = "/appeal/representative-contact-details";

const schema = z.object({
  dxNumber: z.string().trim().max(50, "dxNumberTooLong").optional().default(""),
  referenceNumber: z.string().trim().max(50, "referenceNumberTooLong").optional().default("")
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).representative;
  render(
    res,
    {
      dxNumber: section.dxNumber ?? "",
      referenceNumber: section.referenceNumber ?? ""
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

  await updateDraft(req, "representative", {
    ...parsed.data
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("representative-reference", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
