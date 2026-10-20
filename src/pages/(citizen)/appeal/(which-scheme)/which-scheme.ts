import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./which-scheme.i18n.js";

/**
 * Which scheme the decision was made under.
 *
 * The date of the injury decides it — the War Pensions Scheme for service before
 * 6 April 2005, the Armed Forces Compensation Scheme on or after — and the answer decides
 * whether Section 6 applies, because only an AFCS claim can have had a Reconsideration.
 *
 * "I am not sure" is a third option rather than a validation error. Somebody who does not
 * know which scheme their award is under has not made a mistake, and an error summary
 * telling them to try again would be the service blaming them for its own question. The
 * answer is not stored; the page shows the guidance and asks again.
 */
const BACK = "/appeal/where-do-you-live";
const NEXT = "/appeal/decision-date";

const schema = z.object({
  scheme: z.enum(["warPension", "afcs", "notSure"], { message: "schemeRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).decision;
  render(
    res,
    {
      scheme: section.scheme ?? ""
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

  if (parsed.data.scheme === "notSure") {
    return render(res, req.body, {}, true);
  }

  await updateDraft(req, "decision", {
    scheme: parsed.data.scheme
  });
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>, showHelp = false): void {
  res.render("which-scheme", { en, cy, values, errors, showHelp, backHref: BACK });
}

export const GET = getHandler;
export const POST = postHandler;
