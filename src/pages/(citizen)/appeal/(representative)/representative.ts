import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, replaceSection, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./representative.i18n.js";

/**
 * Whether the appellant has a representative — WPAF1 question 2.1.
 *
 * "No" replaces the whole section rather than merging the answer in, because the hub
 * stops offering the representative's four tasks at the same moment. Details the citizen
 * can no longer see or change must not still be on the appeal when it reaches CCD — or
 * the tribunal would write to a representative nobody meant to name.
 */
const BACK = "/appeal/task-list";
const NEXT = "/appeal/task-list";
const REPRESENTATIVE_NAME = "/appeal/representative-name";

const schema = z.object({
  hasRepresentative: z.enum(["Yes", "No"], { message: "hasRepresentativeRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).representative;
  render(
    res,
    {
      hasRepresentative: section.hasRepresentative ?? ""
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

  if (parsed.data.hasRepresentative === "No") {
    await replaceSection(req, "representative", { hasRepresentative: "No" });
    return res.redirect(302, NEXT);
  }

  await updateDraft(req, "representative", {
    ...parsed.data
  });
  res.redirect(302, REPRESENTATIVE_NAME);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("representative", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
