import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, replaceSection, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./appointee.i18n.js";

/**
 * Whether the appellant has an appointee — WPAF1 question 3.1.
 *
 * "No" replaces the section, which also clears the signing ground. That matters more here
 * than for the representative: the ground is what makes an appointee's signature lawful,
 * and one left behind from an earlier "Yes" would sit on a declaration nobody signed as
 * an appointee.
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/task-list";
const APPOINTEE_NAME = "/appeal/appointee-name";

const schema = z.object({
  hasAppointee: z.enum(["Yes", "No"], { message: "hasAppointeeRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appointee;
  render(
    res,
    {
      hasAppointee: section.hasAppointee ?? ""
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

  if (parsed.data.hasAppointee === "No") {
    await replaceSection(req, "appointee", { hasAppointee: "No" });
    return res.redirect(302, NEXT);
  }

  await updateDraft(req, "appointee", {
    ...parsed.data
  });
  res.redirect(302, APPOINTEE_NAME);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("appointee", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
