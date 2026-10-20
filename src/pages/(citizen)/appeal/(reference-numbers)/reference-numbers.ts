import type { Request, Response } from "express";
import { z } from "zod";
import { draftFrom, updateDraft } from "#appeal";
import { requireRole } from "#oidc";
import { fieldErrors } from "#zod-validation";
import { cy, en } from "./reference-numbers.i18n.js";

/**
 * The appellant's National Insurance and AFCS member numbers — WPAF1 question 1.1.
 *
 * The National Insurance number is required, which the paper form does not make it. Rule
 * 21(5) requires the notice of appeal to give details of the decision including its full
 * reference and there is no decision-reference field on the form, so this is what stands
 * in for it.
 */
const BACK = "/appeal/date-of-birth";
const NEXT = "/appeal/appellant-address";

/**
 * The HMRC format: two prefix letters, six digits, and an A-to-D suffix letter.
 *
 * Checked against the whole value with spaces removed, because a National Insurance
 * number is printed in pairs and nobody should be told off for typing it as it is
 * printed. D, F, I, Q, U and V are never used in either prefix position, O is never
 * second, and the pairs BG, GB, KN, NK, NT, TN and ZZ are not issued — but the pair
 * exclusions are left out: rejecting a real number is a worse failure than accepting an
 * impossible one the tribunal will notice anyway.
 */
const NATIONAL_INSURANCE = /^[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]?$/i;

const schema = z.object({
  nationalInsuranceNumber: z
    .string()
    .trim()
    .min(1, "nationalInsuranceNumberRequired")
    .refine((value) => NATIONAL_INSURANCE.test(value.replace(/\s/g, "")), { message: "nationalInsuranceNumberInvalid" }),
  afcsMemberNumber: z.string().trim().max(30, "afcsMemberNumberTooLong").optional().default("")
});

const getHandler = (req: Request, res: Response) => {
  const section = draftFrom(req).appellant;
  render(
    res,
    {
      nationalInsuranceNumber: section.nationalInsuranceNumber ?? "",
      afcsMemberNumber: section.afcsMemberNumber ?? ""
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
  res.redirect(302, NEXT);
};

function render(res: Response, values: Record<string, unknown>, errors: Record<string, string>): void {
  res.render("reference-numbers", { en, cy, values, errors, backHref: BACK });
}

export const GET = [requireRole("citizen"), getHandler];
export const POST = [requireRole("citizen"), postHandler];
