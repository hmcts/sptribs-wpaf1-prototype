import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./where-do-you-live.i18n.js";

/**
 * Where the appellant lives — the jurisdiction check, and the first question asked.
 *
 * The War Pensions and Armed Forces Compensation Chamber covers England and Wales.
 * Scotland has its own Pensions Appeal Tribunal and Northern Ireland has another, with
 * different addresses, different websites and different privacy regimes, so this service
 * cannot take their appeals. Asking first means somebody in Glasgow finds out now rather
 * than after filling the form in.
 *
 * Unlike a pure eligibility answer, where the appellant lives is a fact about the appeal —
 * it decides which office the case belongs to — so it is stored on the draft and sent to
 * CCD. An off-ramped appeal is never submitted, so nothing is created for Scotland or
 * Northern Ireland.
 */
const BACK = "/";
const NEXT = "/appeal/which-scheme";
const OFF_RAMP = "/appeal/cannot-use-this-service";

const schema = z.object({
  livesIn: z.enum(["england", "wales", "scotland", "northernIreland"], { message: "livesInRequired" })
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appellant;
  render(
    res,
    {
      livesIn: section.livesIn ?? ""
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

  await updateDraft(req, "appellant", {
    ...parsed.data
  });

  const nation = parsed.data.livesIn;
  if (nation === "scotland" || nation === "northernIreland") {
    return res.redirect(302, `${OFF_RAMP}?reason=${nation}`);
  }
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("where-do-you-live", { en, cy, values, errors, backHref: BACK });
}

export const GET = getHandler;
export const POST = postHandler;
