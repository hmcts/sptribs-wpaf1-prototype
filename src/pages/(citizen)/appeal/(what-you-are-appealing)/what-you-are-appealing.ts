import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./what-you-are-appealing.i18n.js";

/**
 * The grounds of appeal — WPAF1 question 4.2.
 *
 * Checkboxes rather than radios because an appeal commonly runs to more than one ground:
 * the same decision can refuse one condition, assess another too low, and start an award
 * from the wrong date.
 *
 * The free text belongs to "Something else" and is cleared when that is unticked, so an
 * appeal cannot carry a description of a ground it is not relying on.
 */
const BACK = "/appeal/decision-date";
const NEXT = "/appeal/task-list";

/** One ticked checkbox posts a string; several post an array. Normalise before validating. */
const toArray = (value: string | string[] | undefined): string[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

const schema = z.object({
  appealAbout: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform(toArray)
    .pipe(z.array(z.enum(["entitlement", "awardLevel", "awardStartDate", "awardChanges", "label", "other"])).min(1, "appealAboutRequired")),
  appealAboutOther: z.string().trim().max(2000, "appealAboutOtherTooLong").optional().default("")
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).decision;
  render(
    res,
    {
      appealAbout: section.appealAbout ?? [],
      appealAboutOther: section.appealAboutOther ?? ""
    },
    {}
  );
};

const postHandler = async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  if (parsed.success && parsed.data.appealAbout.includes("other") && !parsed.data.appealAboutOther) {
    errors.appealAboutOther = "appealAboutOtherRequired";
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    return render(res, { ...req.body, appealAbout: toArray(req.body.appealAbout) }, errors);
  }

  await updateDraft(req, "decision", {
    appealAbout: parsed.data.appealAbout,
    appealAboutOther: parsed.data.appealAbout.includes("other") ? parsed.data.appealAboutOther : undefined
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("what-you-are-appealing", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
