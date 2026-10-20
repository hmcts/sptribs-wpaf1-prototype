import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, replaceSection, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./support.i18n.js";

/**
 * Whether anyone needs additional support — WPAF1 question 8.1.
 *
 * The details are a page of their own rather than a conditional reveal, so there is room
 * to describe what is needed without it being read as an afterthought to a radio button.
 * It is not a task: the hub tracks the question, and the details follow from a "Yes".
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/task-list";
const SUPPORT_DETAILS = "/appeal/support-details";

const schema = z.object({
  needsSupport: z.enum(["Yes", "No"], { message: "needsSupportRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).support;
  render(
    res,
    {
      needsSupport: section.needsSupport ?? ""
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

  if (parsed.data.needsSupport === "No") {
    await replaceSection(req, "support", { needsSupport: "No" });
    return res.redirect(302, NEXT);
  }

  await updateDraft(req, "support", {
    ...parsed.data
  });
  res.redirect(302, SUPPORT_DETAILS);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("support", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
